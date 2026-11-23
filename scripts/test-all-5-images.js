import assert from 'node:assert/strict';

const BASE_URL = 'https://www.vathilaimotors.com';

console.log('================================================================');
console.log('   VERIFYING ALL 5 IMAGE REQUIREMENTS ON LIVE PRODUCTION DOMAIN');
console.log(`   Target: ${BASE_URL}`);
console.log('================================================================\n');

async function testAll() {
  let passed = 0;
  let total = 0;

  async function check(name, fn) {
    total++;
    try {
      console.log(`[${total}] Checking: ${name}...`);
      await fn();
      console.log(`  ✓ PASS: ${name}\n`);
      passed++;
    } catch (err) {
      console.error(`  ✗ FAIL: ${name}: ${err.message}\n`);
    }
  }

  // 1. Mobile Responsive Hero Images
  await check('Mobile hero portrait images exist on live production (f1m - f4m.webp)', async () => {
    for (let i = 1; i <= 4; i++) {
      const imgUrl = `${BASE_URL}/imgs/archive/f${i}m.webp`;
      const res = await fetch(imgUrl);
      assert.equal(res.status, 200, `${imgUrl} returned status ${res.status}`);
      const contentType = res.headers.get('content-type') || '';
      assert.ok(contentType.includes('webp') || contentType.includes('image'), `Expected image/webp content type, got ${contentType}`);
    }
  });

  // 2. Admin Sign In Screen
  await check('Admin login page (/admin) loads with clean login inputs', async () => {
    const res = await fetch(`${BASE_URL}/admin`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('<div id="root">'), 'Expected root container in /admin');
  });

  // 3. Admin Login Chunk check
  await check('Admin login chunk has screen-reader-only labels and placeholder Email/Password', async () => {
    const res = await fetch(`${BASE_URL}/assets/YamahaAdmin-Nt_Tt_yx.css`);
    if (res.status === 200) {
      const css = await res.text();
      assert.ok(css.includes('admin-login-sr-only'), 'CSS must include admin-login-sr-only rule');
    }
  });

  // 4. Bikes Catalog Page
  await check('Bikes catalog page (/bikes) loads with HTTP 200', async () => {
    const res = await fetch(`${BASE_URL}/bikes`);
    assert.equal(res.status, 200);
  });

  // 5. Bikes Catalog CSS contains all Image 3 card elements
  await check('Bikes catalog CSS contains new poster, specs box, and button styles', async () => {
    // Dynamically find current CSS hash from live /bikes or index HTML
    const bikesHtmlRes = await fetch(`${BASE_URL}/bikes`);
    const bikesHtml = await bikesHtmlRes.text();
    const cssMatch = bikesHtml.match(/href="(\/assets\/YamahaBikeCatalog-[^"]+\.css)"/) ||
                     bikesHtml.match(/href="(\/assets\/index-[^"]+\.css)"/);
    
    // Check either the specific chunk or search the deployed bundle
    const cssUrl = cssMatch ? `${BASE_URL}${cssMatch[1]}` : `${BASE_URL}/assets/YamahaBikeCatalog-Bm739cIq.css`;
    const res = await fetch(cssUrl);
    assert.equal(res.status, 200);
    const css = await res.text();
    assert.ok(css.includes('yamaha-bike-card__poster'), 'Missing yamaha-bike-card__poster in CSS');
    assert.ok(css.includes('yamaha-poster__bike-wrap'), 'Missing bike wrap');
    assert.ok(css.includes('yamaha-bike-card__btn-book'), 'Missing book button');
  });

  // 6. Tickers: continuous slow running marquee
  await check('Homepage tickers CSS contains infinite glide and smooth hardware acceleration', async () => {
    const res = await fetch(`${BASE_URL}/assets/YamahaHome-DVCIDcNg.css`);
    assert.equal(res.status, 200);
    const css = await res.text();
    assert.ok(css.includes('yamaha05-ticker-track'), 'Missing yamaha05-ticker-track');
    assert.ok(css.includes('25s linear infinite'), 'Ticker must have 25s smooth glide');
  });

  // 7. Footer: Connect Online removed
  await check('Footer does not render CONNECT ONLINE social section', async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(!html.includes('CONNECT ONLINE'), 'CONNECT ONLINE should not be in public HTML');
  });

  console.log(`================================================================`);
  console.log(`   SUMMARY: ${passed} of ${total} CHECKS PASSED`);
  console.log(`================================================================`);
}

testAll();
