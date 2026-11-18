import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createAdminAuthPolicy,
  validateAdminAuthConfiguration,
} from './adminAuthPolicy.js';

const completeAuthConfiguration = {
  baseURL: 'https://admin.example.invalid',
  issuerBaseURL: 'https://tenant.example.invalid',
  clientID: 'test-client-id',
  clientSecret: 'test-client-secret',
  secret: 'test-auth0-session-secret-long-enough',
};

const allowedSubjects = new Set(['auth0|operator-test']);

function createPolicy({ production = true, authConfigured = true, getAdminSession } = {}) {
  return createAdminAuthPolicy({
    production,
    authConfigured,
    allowedSubjects,
    getAdminSession: getAdminSession ?? (async () => ({
      user: { id: 'local-admin-test', role: 'Super Admin' },
    })),
    getToken: (request) => request.token ?? null,
  });
}

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return body;
    },
  };
}

test('production startup requires complete Auth0 settings and a non-empty allowlist', () => {
  assert.throws(
    () => validateAdminAuthConfiguration({
      production: true,
      authConfiguration: {},
      allowedSubjects: new Set(),
    }),
    /Complete Auth0 configuration is required in production/,
  );

  assert.throws(
    () => validateAdminAuthConfiguration({
      production: true,
      authConfiguration: { ...completeAuthConfiguration, clientSecret: '' },
      allowedSubjects,
    }),
    /Auth0 configuration is incomplete/,
  );

  assert.throws(
    () => validateAdminAuthConfiguration({
      production: true,
      authConfiguration: completeAuthConfiguration,
      allowedSubjects: new Set(),
    }),
    /ADMIN_ALLOWED_SUBJECTS/,
  );

  assert.equal(validateAdminAuthConfiguration({
    production: true,
    authConfiguration: completeAuthConfiguration,
    allowedSubjects,
  }), true);
});

test('production Auth0 authorization allows only exact listed subjects', async () => {
  const policy = createPolicy();
  const allowedRequest = {
    oidc: {
      isAuthenticated: () => true,
      user: { sub: 'auth0|operator-test', name: 'Test Operator' },
    },
  };

  const status = await policy.getSessionStatus(allowedRequest);
  assert.equal(status.authenticated, true);
  assert.equal(status.isAdmin, true);

  const response = createResponse();
  let continued = false;
  await policy.requireAdmin(allowedRequest, response, () => {
    continued = true;
  });
  assert.equal(continued, true);
  assert.equal(allowedRequest.adminUser.sub, 'auth0|operator-test');

  const deniedRequest = {
    oidc: {
      isAuthenticated: () => true,
      user: { sub: 'auth0|operator-test-extra' },
    },
  };
  const deniedStatus = await policy.getSessionStatus(deniedRequest);
  assert.equal(deniedStatus.authenticated, true);
  assert.equal(deniedStatus.isAdmin, false);

  const deniedResponse = createResponse();
  await policy.requireAdmin(deniedRequest, deniedResponse, () => {
    assert.fail('A non-allowlisted Auth0 subject must not reach protected routes.');
  });
  assert.equal(deniedResponse.statusCode, 401);
});

test('production ignores native sessions in session status and protected-route authorization', async () => {
  let nativeSessionLookups = 0;
  const policy = createPolicy({
    getAdminSession: async () => {
      nativeSessionLookups += 1;
      return { user: { id: 'local-admin-test' } };
    },
  });
  const request = { token: 'temporary-native-session-test-token' };

  assert.equal(policy.nativeLoginAllowed, false);
  assert.deepEqual(await policy.getSessionStatus(request), {
    authenticated: false,
    isAdmin: false,
  });

  const response = createResponse();
  await policy.requireAdmin(request, response, () => {
    assert.fail('A native session must not reach production protected routes.');
  });
  assert.equal(response.statusCode, 401);
  assert.equal(nativeSessionLookups, 0);
});

test('unauthenticated requests are denied and non-production native sessions remain compatible', async () => {
  const productionPolicy = createPolicy();
  const unauthorizedResponse = createResponse();
  await productionPolicy.requireAdmin({}, unauthorizedResponse, () => {
    assert.fail('An unauthenticated request must not reach protected routes.');
  });
  assert.equal(unauthorizedResponse.statusCode, 401);
  assert.equal(unauthorizedResponse.body.code, 'authentication_required');

  const localPolicy = createPolicy({ production: false, authConfigured: false });
  const localRequest = { token: 'temporary-native-session-test-token' };
  assert.equal(localPolicy.nativeLoginAllowed, true);
  assert.equal((await localPolicy.getSessionStatus(localRequest)).isAdmin, true);

  const localResponse = createResponse();
  let continued = false;
  await localPolicy.requireAdmin(localRequest, localResponse, () => {
    continued = true;
  });
  assert.equal(continued, true);
});
