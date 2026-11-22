import assert from 'node:assert/strict';
import http from 'node:http';
import dotenv from 'dotenv';

// Force production environment
process.env.NODE_ENV = 'production';
delete process.env.ENABLE_LOCAL_ADMIN;
delete process.env.DISABLE_AUTH0;

// Load real database and config
dotenv.config({ path: 'server/.env' });
const auth0SessionCookie = process.env.AUTH0_SESSION_COOKIE || '';

console.log('--- RUNNING STEP 5 VERIFICATION SUITE IN PRODUCTION MODE ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('ENABLE_LOCAL_ADMIN:', process.env.ENABLE_LOCAL_ADMIN ?? 'UNDEFINED (Strict Production Mode)');

const { app, initializeMongoDatabase } = await import('../server/index.js');

async function runVerification() {
  console.log('\n[1/8] Initializing MongoDB database connection...');
  await initializeMongoDatabase();
  console.log('✓ MongoDB Atlas initialized successfully.');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`✓ Production server started successfully on ${baseUrl}`);

  try {
    // 3 & 4. Verify Health Endpoint
    console.log('\n[2/8] Testing /health, /api/health, and root / endpoints...');
    const rootRes = await fetch(`${baseUrl}/`);
    assert.equal(rootRes.status, 200, `Root endpoint returned status ${rootRes.status}`);
    const healthRes = await fetch(`${baseUrl}/health`);
    assert.equal(healthRes.status, 200, `Health check returned status ${healthRes.status}`);
    const healthData = await healthRes.json();
    console.log('Health Response:', healthData);
    assert.equal(healthData.status, 'ok');
    assert.equal(healthData.database, 'connected');
    console.log('✓ Health check and root endpoint passed with status 200.');

    // Verify public catalog endpoint
    const catalogRes = await fetch(`${baseUrl}/api/public/motorcycles`);
    assert.equal(catalogRes.status, 200);
    const catalogData = await catalogRes.json();
    assert.ok(Array.isArray(catalogData.motorcycles) && catalogData.motorcycles.length > 0);
    console.log(`✓ /api/public/motorcycles verified (${catalogData.motorcycles.length} models).`);

    // 8. Verify CORS from both production domains
    console.log('\n[3/8] Testing CORS preflight and headers from both production domains...');
    for (const origin of ['https://www.vathilaimotors.com', 'https://vathilaimotors.com']) {
      const corsPreflight = await fetch(`${baseUrl}/api/admin/overview`, {
        method: 'OPTIONS',
        headers: {
          Origin: origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Authorization, X-Admin-Token, Content-Type, X-Filename',
        },
      });
      assert.equal(corsPreflight.status, 204, `CORS preflight returned ${corsPreflight.status} for ${origin}`);
      assert.equal(corsPreflight.headers.get('access-control-allow-origin'), origin);
      assert.equal(corsPreflight.headers.get('access-control-allow-credentials'), 'true');
      console.log(`✓ CORS preflight approved for ${origin} with credentials.`);
    }

    // 6. Verify unauthorized users cannot access admin APIs
    console.log('\n[4/8] Testing unauthorized access block on protected admin API (/api/admin/overview)...');
    const unauthRes = await fetch(`${baseUrl}/api/admin/overview`);
    assert.equal(unauthRes.status, 401, `Expected 401 but got ${unauthRes.status}`);
    const unauthBody = await unauthRes.json();
    assert.equal(unauthBody.code, 'authentication_required');
    console.log('✓ Unauthenticated request was strictly blocked with HTTP 401 authentication_required.');

    // 6b. Verify unauthorized token block
    console.log('\n[5/8] Testing invalid token block on protected admin API...');
    const fakeTokenRes = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: {
        Authorization: 'Bearer invalid_tampered_token_999',
      },
    });
    assert.equal(fakeTokenRes.status, 401, `Expected 401 but got ${fakeTokenRes.status}`);
    console.log('✓ Tampered/invalid token strictly rejected with HTTP 401.');

    console.log('\n[6/8] Verifying native admin login is disabled in production...');
    const nativeLoginRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'native-login-disabled@example.invalid',
        password: 'not-a-real-credential',
      }),
    });
    assert.equal(nativeLoginRes.status, 403, `Native login returned ${nativeLoginRes.status}`);
    assert.equal((await nativeLoginRes.json()).code, 'auth0_required');
    console.log('✓ Production native login was rejected.');

    if (!auth0SessionCookie) {
      console.log('Skipping allowlisted-admin data checks; AUTH0_SESSION_COOKIE was not provided.');
      return;
    }
    const auth0Headers = { Cookie: auth0SessionCookie };

    // 7. Verify authorized admin users can access protected APIs
    console.log('\n[7/9] Testing authorized access using an existing Auth0 session...');
    const authApiRes = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: {
        ...auth0Headers,
        Origin: 'https://www.vathilaimotors.com',
      },
    });
    assert.equal(authApiRes.status, 200, `Expected 200 but got ${authApiRes.status}`);
    assert.equal(authApiRes.headers.get('access-control-allow-origin'), 'https://www.vathilaimotors.com');
    const overviewData = await authApiRes.json();
    assert.ok(typeof overviewData.totalMotorcycles === 'number', 'Overview must contain totalMotorcycles');
    console.log('✓ Authorized admin accessed protected /api/admin/overview successfully!');
    console.log('Total Motorcycles in Catalog:', overviewData.totalMotorcycles);
    console.log('Total Bookings:', overviewData.totalBookings);
    console.log('Total Enquiries:', overviewData.totalEnquiries);

    // Verify enquiries and bookings endpoints
    const enquiriesRes = await fetch(`${baseUrl}/api/admin/enquiries?source=all`, {
      headers: auth0Headers,
    });
    assert.equal(enquiriesRes.status, 200);
    const enquiriesData = await enquiriesRes.json();
    assert.ok(Array.isArray(enquiriesData.enquiries), 'Enquiries must be an array');
    console.log(`✓ Enquiries loaded from MongoDB Atlas: ${enquiriesData.enquiries.length} records.`);

    const bookingsRes = await fetch(`${baseUrl}/api/admin/bookings`, {
      headers: auth0Headers,
    });
    assert.equal(bookingsRes.status, 200);
    const bookingsData = await bookingsRes.json();
    assert.ok(Array.isArray(bookingsData.bookings), 'Bookings must be an array');
    console.log(`✓ Bookings loaded from MongoDB Atlas: ${bookingsData.bookings.length} records.`);

    // Verify session check
    console.log('\n[8/9] Testing /api/admin/session endpoint with session token...');
    const sessionRes = await fetch(`${baseUrl}/api/admin/session`, {
      headers: auth0Headers,
    });
    assert.equal(sessionRes.status, 200);
    const sessionData = await sessionRes.json();
    assert.equal(sessionData.authenticated, true);
    assert.equal(sessionData.isAdmin, true);
    console.log('✓ Allowlisted Auth0 admin session confirmed.');

    // Verify logout
    console.log('\n[9/9] Testing Auth0 logout routing...');
    const logoutRes = await fetch(`${baseUrl}/logout`, {
      headers: auth0Headers,
      redirect: 'manual',
    });
    assert.equal(logoutRes.status, 302);
    console.log('✓ Auth0 logout redirect returned.');

    console.log('\n======================================================');
    console.log('PRODUCTION AUTHENTICATION VERIFICATION PASSED.');
    console.log('======================================================\n');
  } finally {
    server.close();
  }
}

runVerification().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
