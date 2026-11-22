import assert from 'node:assert/strict';

const FRONTEND_URL = 'https://www.vathilaimotors.com';
const BACKEND_URL = 'https://vathilai-motors-api.onrender.com';
const AUTH0_SESSION_COOKIE = process.env.AUTH0_SESSION_COOKIE || '';

console.log('========================================================');
console.log('   VATHILAI MOTORS — LIVE PRODUCTION VERIFICATION');
console.log(`   Frontend: ${FRONTEND_URL}`);
console.log(`   Backend:  ${BACKEND_URL}`);
console.log('========================================================\n');

async function runLiveVerification() {
  // Test 1: Opening /admin directly
  console.log('[1/10] Testing direct access to https://www.vathilaimotors.com/admin...');
  const adminPageRes = await fetch(`${FRONTEND_URL}/admin`);
  assert.equal(adminPageRes.status, 200, `Expected 200 but got ${adminPageRes.status}`);
  const adminHtml = await adminPageRes.text();
  assert.ok(adminHtml.includes('<div id="root">'), 'HTML must contain React root container');
  console.log('✓ /admin returned HTTP 200 with valid SPA HTML.');

  // Test 2: Refreshing deep SPA route /admin/bookings
  console.log('\n[2/10] Testing deep SPA refresh on https://www.vathilaimotors.com/admin/bookings...');
  const deepRes = await fetch(`${FRONTEND_URL}/admin/bookings`);
  assert.equal(deepRes.status, 200, `Expected 200 but got ${deepRes.status}`);
  const deepHtml = await deepRes.text();
  assert.ok(deepHtml.includes('<div id="root">'), 'HTML must contain React root container');
  console.log('✓ /admin/bookings returned HTTP 200 (no 404).');

  // Test 3: Vercel API proxy rewrite
  console.log('\n[3/10] Testing Vercel API rewrite: https://www.vathilaimotors.com/api/public/motorcycles...');
  const proxyRes = await fetch(`${FRONTEND_URL}/api/public/motorcycles`);
  assert.equal(proxyRes.status, 200, `API rewrite returned ${proxyRes.status}`);
  const proxyData = await proxyRes.json();
  assert.ok(Array.isArray(proxyData.motorcycles) && proxyData.motorcycles.length > 0);
  console.log(`✓ Vercel successfully proxied to Render (${proxyData.motorcycles.length} motorcycles retrieved).`);

  // Test 4: Live Render backend health check
  console.log('\n[4/10] Testing live Render backend /health endpoint...');
  const healthRes = await fetch(`${BACKEND_URL}/health`);
  assert.equal(healthRes.status, 200, `/health returned ${healthRes.status}`);
  const healthData = await healthRes.json();
  assert.equal(healthData.status, 'ok');
  assert.equal(healthData.database, 'connected');
  console.log('✓ Render backend is healthy with MongoDB Atlas connected:', healthData);

  // Test 5: Live CORS preflight from https://www.vathilaimotors.com
  console.log('\n[5/10] Testing CORS preflight on live Render backend...');
  const corsRes = await fetch(`${BACKEND_URL}/api/admin/overview`, {
    method: 'OPTIONS',
    headers: {
      Origin: FRONTEND_URL,
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Authorization, X-Admin-Token, Content-Type, X-Filename',
    },
  });
  assert.equal(corsRes.status, 204, `CORS preflight returned ${corsRes.status}`);
  assert.equal(corsRes.headers.get('access-control-allow-origin'), FRONTEND_URL);
  assert.equal(corsRes.headers.get('access-control-allow-credentials'), 'true');
  console.log('✓ CORS preflight approved with credentials for https://www.vathilaimotors.com.');

  // Test 6: Native login must be rejected on the live backend
  console.log('\n[6/10] Verifying native admin login is disabled...');
  const nativeLoginRes = await fetch(`${BACKEND_URL}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: FRONTEND_URL,
    },
    body: JSON.stringify({
      email: 'native-login-disabled@example.invalid',
      password: 'not-a-real-credential',
    }),
  });
  assert.equal(nativeLoginRes.status, 403, `Native login returned ${nativeLoginRes.status}`);
  assert.equal((await nativeLoginRes.json()).code, 'auth0_required');
  console.log('✓ Native login was rejected.');

  if (!AUTH0_SESSION_COOKIE) {
    const unauthenticated = await fetch(`${BACKEND_URL}/api/admin/overview`, {
      headers: { Origin: FRONTEND_URL },
    });
    assert.equal(unauthenticated.status, 401);
    console.log('✓ Protected admin API rejects unauthenticated requests.');
    console.log('Skipping allowlisted Auth0 checks; AUTH0_SESSION_COOKIE was not provided.');
    console.log('\nLive public checks and native-login rejection passed; authenticated checks were skipped.');
    process.exit(0);
    return;
  }
  const auth0Headers = { Cookie: AUTH0_SESSION_COOKIE, Origin: FRONTEND_URL };

  // Test 7: Verify live admin session with token
  console.log('\n[7/10] Testing live admin session (GET /api/admin/session)...');
  const sessionRes = await fetch(`${BACKEND_URL}/api/admin/session`, {
    headers: auth0Headers,
  });
  assert.equal(sessionRes.status, 200);
  const sessionData = await sessionRes.json();
  assert.equal(sessionData.authenticated, true);
  assert.equal(sessionData.isAdmin, true);
  console.log('✓ Allowlisted Auth0 admin session confirmed.');

  // Test 8: Live protected overview metrics
  console.log('\n[8/10] Testing live protected overview (GET /api/admin/overview)...');
  const overviewRes = await fetch(`${BACKEND_URL}/api/admin/overview`, {
    headers: auth0Headers,
  });
  assert.equal(overviewRes.status, 200);
  const overviewData = await overviewRes.json();
  assert.equal(overviewData.source, 'mongodb');
  assert.equal(overviewData.databaseConnected, true);
  console.log('✓ Live admin overview verified:');
  console.log('  Database Provider:', overviewData.databaseType);
  console.log('  Total Motorcycles in Catalog:', overviewData.totalMotorcycles);
  console.log('  Total Bookings:', overviewData.totalBookings);
  console.log('  Total Enquiries:', overviewData.totalEnquiries);
  console.log('  Total Customer Reviews:', overviewData.totalReviews);
  console.log('  Service Videos:', overviewData.totalServiceVideos);

  // Test 9: Live enquiries and bookings retrieval from MongoDB Atlas
  console.log('\n[9/10] Testing live enquiries and bookings retrieval from MongoDB Atlas...');
  const enquiriesRes = await fetch(`${BACKEND_URL}/api/admin/enquiries?source=all`, {
    headers: auth0Headers,
  });
  assert.equal(enquiriesRes.status, 200);
  const enquiriesData = await enquiriesRes.json();
  assert.ok(Array.isArray(enquiriesData.enquiries));
  console.log(`✓ Enquiries retrieved from MongoDB: ${enquiriesData.enquiries.length} enquiry record(s).`);

  const bookingsRes = await fetch(`${BACKEND_URL}/api/admin/bookings`, {
    headers: auth0Headers,
  });
  assert.equal(bookingsRes.status, 200);
  const bookingsData = await bookingsRes.json();
  assert.ok(Array.isArray(bookingsData.bookings));
  console.log(`✓ Bookings retrieved from MongoDB: ${bookingsData.bookings.length} booking record(s).`);

  // Test 10: Auth0 logout routing
  console.log('\n[10/10] Testing live Auth0 logout routing...');
  const logoutRes = await fetch(`${BACKEND_URL}/logout`, {
    headers: auth0Headers,
    redirect: 'manual',
  });
  assert.equal(logoutRes.status, 302);
  console.log('✓ Auth0 logout redirect returned.');

  console.log('\n========================================================');
  console.log('  LIVE PUBLIC AND AUTH0 SESSION CHECKS PASSED!');
  console.log('========================================================\n');
  process.exit(0);
}

runLiveVerification().catch((err) => {
  console.error('\n❌ LIVE PRODUCTION VERIFICATION FAILED:', err);
  process.exit(1);
});
