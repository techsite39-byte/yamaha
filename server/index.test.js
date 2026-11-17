import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = '';
process.env.WHATSAPP_VERIFY_TOKEN = 'test-only-whatsapp-verify-token';
delete process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
for (const key of [
  'AUTH0_BASE_URL',
  'AUTH0_ISSUER_BASE_URL',
  'AUTH0_CLIENT_ID',
  'AUTH0_CLIENT_SECRET',
  'AUTH0_SECRET',
  'ADMIN_ALLOWED_SUBJECTS',
]) {
  delete process.env[key];
}

const { app } = await import('./index.js');
const catalogPath = resolve('server/data/motorcycles.json');
const bookingsPath = resolve('server/data/bookings.json');

test('public business settings expose the current dealership details', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolveListen) => server.once('listening', resolveListen));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const response = await fetch(`${base}/api/public/settings`);
    assert.equal(response.status, 200);
    const { settings } = await response.json();
    assert.equal(settings.dealershipName, 'Vathilai Motors');
    assert.equal(settings.phone, '081444 45566');
    assert.equal(settings.address, 'Parimalam Theatre Complex, Main Road, Opp. Union Office Madurai, Batlagundu, Dindigul, Tamil Nadu – 624202.');
    assert.equal(settings.instagramUrl, 'https://www.instagram.com/vathilaimotors/');
    assert.equal(settings.googleRatingVerified, true);
    assert.equal(settings.googleRating, 4.5);
    assert.equal(settings.googleReviewCount, 36);
    assert.equal(settings.whatsapp, '');
    assert.equal(settings.email, '');
  } finally {
    await closeServer(server);
  }
});

test('WhatsApp webhook aliases return the challenge and reject invalid tokens', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolveListen) => server.once('listening', resolveListen));
  const base = `http://127.0.0.1:${server.address().port}`;
  const query = new URLSearchParams({
    'hub.mode': 'subscribe',
    'hub.verify_token': 'test-only-whatsapp-verify-token',
    'hub.challenge': 'read-only-test-challenge',
  });

  try {
    for (const alias of ['/api/public/whatsapp/webhook', '/api/whatsapp/webhook']) {
      const valid = await fetch(`${base}${alias}?${query}`);
      assert.equal(valid.status, 200);
      assert.equal(await valid.text(), 'read-only-test-challenge');

      const invalid = await fetch(`${base}${alias}?${new URLSearchParams({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong-test-token',
        'hub.challenge': 'unused',
      })}`);
      assert.equal(invalid.status, 403);
    }

    delete process.env.WHATSAPP_VERIFY_TOKEN;
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'test-only-whatsapp-verify-token';
    const legacyOnly = await fetch(`${base}/api/whatsapp/webhook?${query}`);
    assert.equal(legacyOnly.status, 403);
  } finally {
    delete process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    process.env.WHATSAPP_VERIFY_TOKEN = 'test-only-whatsapp-verify-token';
    await closeServer(server);
  }
});

async function closeServer(server) {
  const closed = new Promise((resolveClose, rejectClose) => {
    server.close((error) => error ? rejectClose(error) : resolveClose());
  });
  server.closeAllConnections?.();
  await closed;
}

test('motorcycle CRUD validates data and updates the public catalog', {
  skip: existsSync(catalogPath) ? 'A local catalog already exists; refusing to modify user data.' : false,
}, async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolveListen) => server.once('listening', resolveListen));
  const base = `http://127.0.0.1:${server.address().port}`;
  const payload = {
    model: 'Admin API Test',
    category: 'API TEST / VALIDATION',
    description: 'Temporary integration test motorcycle.',
    cta: 'EXPLORE ADMIN API TEST',
    image: '/imgs/1.%20Yamaha%20YZF-R1.webp',
    catalogue: {
      market: 'IN',
      category: 'Sport Bikes',
      published: true,
      available: true,
      variants: [],
      colors: [],
      specifications: [],
      prices: [],
      gallery: [],
      officialSourceUrl: 'https://example.com/motorcycle',
      priceNote: 'Retain this note when legacy fields are edited.',
    },
  };
  let created = false;

  const postMotorcycle = (motorcycle) => fetch(`${base}/api/admin/motorcycles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(motorcycle),
  });

  try {
    const session = await (await fetch(`${base}/api/admin/session`)).json();
    assert.equal(session.developmentAccess, true);
    assert.equal(session.isAdmin, true);

    const initial = await (await fetch(`${base}/api/public/motorcycles`)).json();
    const initialCount = initial.motorcycles.length;
    let response = await postMotorcycle(payload);
    assert.equal(response.status, 201);
    const createdResponse = await response.json();
    created = true;
    assert.equal(createdResponse.motorcycle.id, 'admin-api-test');
    assert.ok(createdResponse.motorcycle.features.length > 0);
    assert.equal(createdResponse.motorcycle.heading.length, 2);

    response = await fetch(`${base}/api/admin/motorcycles/admin-api-test`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, catalogue: undefined, description: 'Updated integration record.' }),
    });
    assert.equal(response.status, 200);
    const updated = (await response.json()).motorcycle;
    assert.equal(updated.description, 'Updated integration record.');
    assert.equal(updated.catalogue.priceNote, 'Retain this note when legacy fields are edited.');
    assert.equal((await (await fetch(`${base}/api/public/motorcycles`)).json()).motorcycles.length, initialCount + 1);

    response = await postMotorcycle({ ...payload, model: 'Invalid Image', image: 'https://example.com/image.jpg' });
    assert.equal(response.status, 400);
    response = await postMotorcycle(payload);
    assert.equal(response.status, 409);

    response = await fetch(`${base}/api/admin/motorcycles/admin-api-test`, { method: 'DELETE' });
    assert.equal(response.status, 204);
    created = false;

    let remaining = (await (await fetch(`${base}/api/public/motorcycles`)).json()).motorcycles;
    assert.equal(remaining.length, initialCount);
    while (remaining.length > 1) {
      response = await fetch(`${base}/api/admin/motorcycles/${encodeURIComponent(remaining[0].id)}`, { method: 'DELETE' });
      assert.equal(response.status, 204);
      remaining = (await (await fetch(`${base}/api/public/motorcycles`)).json()).motorcycles;
    }
    response = await fetch(`${base}/api/admin/motorcycles/${encodeURIComponent(remaining[0].id)}`, { method: 'DELETE' });
    assert.equal(response.status, 409);
  } finally {
    if (created) await fetch(`${base}/api/admin/motorcycles/admin-api-test`, { method: 'DELETE' });
    await closeServer(server);
    if (existsSync(catalogPath)) await unlink(catalogPath);
  }
});

test('public booking enquiries are validated, persisted, de-duplicated, and admin-managed', {
  skip: existsSync(bookingsPath) ? 'A local bookings file already exists; refusing to modify customer data.' : false,
}, async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolveListen) => server.once('listening', resolveListen));
  const base = `http://127.0.0.1:${server.address().port}`;
  let uploadedImagePath;
  const payload = {
    requestId: 'booking-test-request-0001',
    motorcycleId: 'r15-v4',
    variant: 'Standard (without quickshifter)',
    color: 'Racing Blue',
    customer: {
      name: 'Test Customer',
      phone: '+91 9876543210',
      email: 'customer@example.com',
      city: 'Chennai',
      message: 'Please contact after 4 pm.',
    },
    consent: true,
  };

  try {
    let response = await fetch(`${base}/api/public/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, consent: false }),
    });
    assert.equal(response.status, 400);

    response = await fetch(`${base}/api/public/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assert.equal(response.status, 201);
    const first = await response.json();
    assert.match(first.reference, /^VM\d{6}-[A-F0-9]{8}$/);

    response = await fetch(`${base}/api/public/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).reference, first.reference);

    response = await fetch(`${base}/api/admin/bookings`);
    const listed = await response.json();
    assert.equal(response.status, 200);
    assert.equal(listed.bookings.length, 1);
    assert.equal(listed.bookings[0].customer.email, 'customer@example.com');
    assert.equal(listed.bookings[0].status, 'new');
    assert.equal(listed.bookings[0].priceSnapshot.onRoad, 212146);

    response = await fetch(`${base}/api/admin/bookings/${encodeURIComponent(first.reference)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'contacted' }),
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).booking.status, 'contacted');

    response = await fetch(`${base}/api/public/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, requestId: 'booking-test-invalid-0001', variant: 'not-a-variant' }),
    });
    assert.equal(response.status, 400);

    response = await fetch(`${base}/api/public/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        requestId: 'booking-test-color-mismatch',
        motorcycleId: 'r15m-india',
        variant: 'M Icon Performance',
        color: 'Metallic Grey',
      }),
    });
    assert.equal(response.status, 400);

    const image = await readFile(resolve('public/imgs/catalog/yamaha-r15-v4.webp'));
    response = await fetch(`${base}/api/admin/motorcycles/r15-v4/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/webp' },
      body: image,
    });
    assert.equal(response.status, 201);
    const uploaded = await response.json();
    assert.match(uploaded.imagePath, /^\/imgs\/catalog\/uploads\/yamaha-r15-v4-\d+-[a-f0-9]{12}\.webp$/);
    uploadedImagePath = resolve('public', `.${uploaded.imagePath}`);
    assert.equal(existsSync(uploadedImagePath), true);
  } finally {
    await closeServer(server);
    if (existsSync(bookingsPath)) await unlink(bookingsPath);
    if (uploadedImagePath && existsSync(uploadedImagePath)) await unlink(uploadedImagePath);
  }
});
