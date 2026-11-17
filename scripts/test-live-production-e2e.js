import assert from 'node:assert/strict';

const FRONTEND_URL = 'https://www.vathilaimotors.com';
const BACKEND_URL = 'https://vathilai-motors-api.onrender.com';

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

  // Test 6: Admin login on live backend
  console.log('\n[6/10] Testing live admin login (POST /api/admin/login)...');
  const loginRes = await fetch(`${BACKEND_URL}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: FRONTEND_URL,
    },
    body: JSON.stringify({
      email: 'yourssanjay63@gmail.com',
      password: 'admin123456#',
      rememberMe: true,
    }),
  });
  assert.equal(loginRes.status, 200, `Login returned ${loginRes.status}`);
  const loginData = await loginRes.json();
  assert.equal(loginData.success, true);
  assert.ok(loginData.token);
  assert.equal(loginData.user.role, 'Super Admin');
  const setCookie = loginRes.headers.get('set-cookie') || '';
  console.log('✓ Admin login successful.');
  console.log('  Role:', loginData.user.role);
  console.log('  Token prefix:', loginData.token.slice(0, 12) + '...');
  console.log('  Cross-origin cookie:', setCookie.slice(0, 80) + '...');

  // Test 7: Verify live admin session with token
  console.log('\n[7/10] Testing live admin session (GET /api/admin/session)...');
  const sessionRes = await fetch(`${BACKEND_URL}/api/admin/session`, {
    headers: {
      Authorization: `Bearer ${loginData.token}`,
      Origin: FRONTEND_URL,
    },
  });
  assert.equal(sessionRes.status, 200);
  const sessionData = await sessionRes.json();
  assert.equal(sessionData.authenticated, true);
  assert.equal(sessionData.isAdmin, true);
  assert.equal(sessionData.user.email, 'yourssanjay63@gmail.com');
  console.log('✓ Admin session confirmed on live backend for:', sessionData.user.name);

  // Test 8: Live protected overview metrics
  console.log('\n[8/10] Testing live protected overview (GET /api/admin/overview)...');
  const overviewRes = await fetch(`${BACKEND_URL}/api/admin/overview`, {
    headers: {
      Authorization: `Bearer ${loginData.token}`,
      Origin: FRONTEND_URL,
    },
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
    headers: { Authorization: `Bearer ${loginData.token}` },
  });
  assert.equal(enquiriesRes.status, 200);
  const enquiriesData = await enquiriesRes.json();
  assert.ok(Array.isArray(enquiriesData.enquiries));
  console.log(`✓ Enquiries retrieved from MongoDB: ${enquiriesData.enquiries.length} enquiry record(s).`);

  const bookingsRes = await fetch(`${BACKEND_URL}/api/admin/bookings`, {
    headers: { Authorization: `Bearer ${loginData.token}` },
  });
  assert.equal(bookingsRes.status, 200);
  const bookingsData = await bookingsRes.json();
  assert.ok(Array.isArray(bookingsData.bookings));
  console.log(`✓ Bookings retrieved from MongoDB: ${bookingsData.bookings.length} booking record(s).`);

  // Test 10: Live logout and token invalidation
  console.log('\n[10/10] Testing live admin logout (POST /api/admin/logout)...');
  const logoutRes = await fetch(`${BACKEND_URL}/api/admin/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${loginData.token}` },
  });
  assert.equal(logoutRes.status, 200);
  const postLogout = await fetch(`${BACKEND_URL}/api/admin/session`, {
    headers: { Authorization: `Bearer ${loginData.token}` },
  });
  const postLogoutData = await postLogout.json();
  assert.equal(postLogoutData.authenticated, false, 'Revoked token must not be authenticated');
  console.log('✓ Token successfully revoked upon logout.');

  console.log('\n========================================================');
  console.log('  ALL 10 LIVE PRODUCTION TESTS PASSED WITH ZERO ERRORS!');
  console.log('========================================================\n');
  process.exit(0);
}

runLiveVerification().catch((err) => {
  console.error('\n❌ LIVE PRODUCTION VERIFICATION FAILED:', err);
  process.exit(1);
});
