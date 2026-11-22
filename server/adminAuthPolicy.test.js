import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
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

test('production server rejects native login and requires authenticated admin authorization', () => {
  const script = `
    import assert from 'node:assert/strict';
    const fetchIssuerMetadata = globalThis.fetch;
    globalThis.fetch = async (input, options) => {
      const requestURL = new URL(typeof input === 'string' ? input : input.url);
      if (requestURL.hostname === 'tenant.example.invalid'
        && requestURL.pathname === '/.well-known/openid-configuration') {
        return new Response(JSON.stringify({
          issuer: 'https://tenant.example.invalid/',
          authorization_endpoint: 'https://tenant.example.invalid/authorize',
          token_endpoint: 'https://tenant.example.invalid/oauth/token',
          jwks_uri: 'https://tenant.example.invalid/.well-known/jwks.json',
          response_types_supported: ['code'],
          subject_types_supported: ['public'],
          id_token_signing_alg_values_supported: ['RS256'],
        }), {
          headers: { 'content-type': 'application/json' },
        });
      }
      return fetchIssuerMetadata(input, options);
    };
    const { app } = await import('./server/index.js');
    const server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    const base = \`http://127.0.0.1:\${server.address().port}\`;
    try {
      const login = await fetch(\`\${base}/api/admin/login\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'disabled@example.invalid', password: 'not-a-real-credential' }),
      });
      assert.equal(login.status, 403);
      assert.equal((await login.json()).code, 'auth0_required');

      const session = await fetch(\`\${base}/api/admin/session\`, {
        headers: { Authorization: 'Bearer temporary-native-session-token' },
      });
      assert.equal(session.status, 200);
      assert.deepEqual(await session.json(), { authenticated: false, isAdmin: false });

      const protectedResponse = await fetch(\`\${base}/api/admin/overview\`, {
        headers: { Authorization: 'Bearer temporary-native-session-token' },
      });
      assert.equal(protectedResponse.status, 401);

      const auth0Login = await fetch(\`\${base}/login\`, { redirect: 'manual' });
      assert.equal(auth0Login.status, 302);
    } finally {
      server.closeAllConnections?.();
      await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
    }
  `;
  const productionEnv = {
    ...process.env,
    NODE_ENV: 'production',
    MONGODB_URI: '',
    AUTH0_BASE_URL: completeAuthConfiguration.baseURL,
    AUTH0_ISSUER_BASE_URL: completeAuthConfiguration.issuerBaseURL,
    AUTH0_CLIENT_ID: completeAuthConfiguration.clientID,
    AUTH0_CLIENT_SECRET: completeAuthConfiguration.clientSecret,
    AUTH0_SECRET: completeAuthConfiguration.secret,
    ADMIN_ALLOWED_SUBJECTS: 'auth0|operator-test',
  };
  delete productionEnv.ADMIN_BOOTSTRAP_EMAIL;
  delete productionEnv.ADMIN_BOOTSTRAP_PASSWORD;
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: productionEnv,
  });

  assert.equal(child.status, 0, `Production route test failed: ${child.stderr}`);
});

test('production server startup fails when Auth0 configuration is absent', () => {
  const productionEnv = {
    ...process.env,
    NODE_ENV: 'production',
    MONGODB_URI: '',
    AUTH0_BASE_URL: '',
    AUTH0_ISSUER_BASE_URL: '',
    AUTH0_CLIENT_ID: '',
    AUTH0_CLIENT_SECRET: '',
    AUTH0_SECRET: '',
    ADMIN_ALLOWED_SUBJECTS: '',
  };
  delete productionEnv.ADMIN_BOOTSTRAP_EMAIL;
  delete productionEnv.ADMIN_BOOTSTRAP_PASSWORD;
  const child = spawnSync(process.execPath, [
    '--input-type=module',
    '-e',
    "await import('./server/index.js');",
  ], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: productionEnv,
  });

  assert.notEqual(child.status, 0);
  assert.match(child.stderr, /Complete Auth0 configuration is required in production/);
});
