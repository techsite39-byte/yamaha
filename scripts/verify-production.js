const testUrls = [
  'https://www.vathilaimotors.com/',
  'https://www.vathilaimotors.com/privacy-policy',
  'https://www.vathilaimotors.com/terms',
  'https://www.vathilaimotors.com/data-deletion',
  'https://vathilaimotors.com/privacy-policy',
];

async function check() {
  console.log('Testing live URLs on https://www.vathilaimotors.com/...\n');
  
  for (const url of testUrls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        redirect: 'manual',
      });
      console.log(`URL: ${url}`);
      console.log(`Status: ${res.status} ${res.statusText}`);
      console.log(`Server: ${res.headers.get('server') || 'N/A'}`);
      console.log(`Location: ${res.headers.get('location') || 'N/A'}`);
      console.log(`Age: ${res.headers.get('age') || 'N/A'}`);
      console.log(`X-Vercel-Cache: ${res.headers.get('x-vercel-cache') || 'N/A'}`);
      console.log(`X-Vercel-Error: ${res.headers.get('x-vercel-error') || 'None'}`);
      if (res.status === 200) {
        const text = await res.text();
        const titleMatch = text.match(/<title>(.*?)<\/title>/i);
        console.log(`Page Title: ${titleMatch ? titleMatch[1] : 'No title tag'}`);
      }
      console.log('---');
    } catch (err) {
      console.error(`URL: ${url} Failed with error: ${err.message}`);
      console.log('---');
    }
  }

  // Also test the data deletion POST endpoint
  try {
    const postUrl = 'https://www.vathilaimotors.com/api/public/data-deletion-request';
    console.log(`Testing POST ${postUrl}...`);
    const postRes = await fetch(postUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: 'Production Verifier',
        phone: '9841234567',
        email: 'verify@vathilaimotors.com',
        requestType: 'full_deletion',
        reason: 'Automated verification check',
      }),
    });
    console.log(`Status: ${postRes.status} ${postRes.statusText}`);
    const postData = await postRes.json();
    console.log('Response Body:', postData);
  } catch (err) {
    console.error('Data deletion API error:', err.message);
  }
}

check();
