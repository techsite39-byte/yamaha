import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeWhatsAppNumber,
  formatBookingWhatsAppText,
  sendWhatsAppMessage,
  verifyWhatsAppWebhookChallenge,
  parseWhatsAppWebhookPayload,
  shouldUpdateStatus,
} from './whatsappService.js';

test('WhatsApp Service: normalizeWhatsAppNumber', async (t) => {
  await t.test('formats 10-digit Indian number starting with 6-9', () => {
    const res = normalizeWhatsAppNumber('9025335720');
    assert.equal(res.valid, true);
    assert.equal(res.local, '9025335720');
    assert.equal(res.international, '919025335720');
    assert.equal(res.e164, '+919025335720');
  });

  await t.test('strips leading 0 and dashes/spaces', () => {
    const res = normalizeWhatsAppNumber('090253-35720');
    assert.equal(res.valid, true);
    assert.equal(res.local, '9025335720');
    assert.equal(res.international, '919025335720');
  });

  await t.test('handles existing +91 prefix', () => {
    const res = normalizeWhatsAppNumber('+91 98412 34567');
    assert.equal(res.valid, true);
    assert.equal(res.local, '9841234567');
    assert.equal(res.international, '919841234567');
    assert.equal(res.e164, '+919841234567');
  });

  await t.test('rejects invalid short numbers', () => {
    const res = normalizeWhatsAppNumber('12345');
    assert.equal(res.valid, false);
    assert.match(res.error, /Invalid Indian mobile number/);
  });

  await t.test('rejects numbers starting with invalid digits (e.g. 1-5)', () => {
    const res = normalizeWhatsAppNumber('3456789012');
    assert.equal(res.valid, false);
  });

  await t.test('rejects dealership own phone number to prevent self-messaging', () => {
    const dealershipVariations = ['081444 45566', '8144445566', '+918144445566', '918144445566'];
    for (const dp of dealershipVariations) {
      const res = normalizeWhatsAppNumber(dp);
      assert.equal(res.valid, false, `Should reject dealership phone ${dp}`);
      assert.match(res.error, /dealership own phone number/);
    }
  });
});

test('WhatsApp Service: formatBookingWhatsAppText', () => {
  const sampleBooking = {
    reference: 'VM261115-A1B2C3',
    model: 'Yamaha YZF-R15 V4',
    variant: 'Racing Blue',
    customer: {
      name: 'Naveen Eswaran',
      phone: '9025335720',
    },
    appointmentDate: '2026-11-20',
    appointmentTime: '10:00 AM – 12:00 PM',
    priceSnapshot: {
      exShowroom: 182000,
    },
  };

  const text = formatBookingWhatsAppText(sampleBooking);
  assert.match(text, /VATHILAI MOTORS/);
  assert.match(text, /Naveen Eswaran/);
  assert.match(text, /VM261115-A1B2C3/);
  assert.match(text, /Yamaha YZF-R15 V4/);
  assert.match(text, /₹1,82,000/);
  assert.match(text, /081444 45566/);
});

test('WhatsApp Service: sendWhatsAppMessage with unconfigured provider', async () => {
  delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  delete process.env.WHATSAPP_ACCESS_TOKEN;
  delete process.env.WHATSAPP_WEBHOOK_URL;
  delete process.env.WHATSAPP_SIMULATE_DELIVERY;

  const result = await sendWhatsAppMessage({
    booking: {
      reference: 'VMTEST-001',
      customer: { name: 'Test User', phone: '9025335720' },
    },
  });

  assert.equal(result.success, false);
  assert.equal(result.status, 'FAILED');
  assert.match(result.error, /WhatsApp Cloud API credentials not configured/);
  assert.equal(result.recipient, '919025335720');
});

test('WhatsApp Service: verifyWhatsAppWebhookChallenge', () => {
  process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'test_secret_token_123';

  // Successful challenge
  const valid = verifyWhatsAppWebhookChallenge({
    'hub.mode': 'subscribe',
    'hub.verify_token': 'test_secret_token_123',
    'hub.challenge': 'CHALLENGE_STRING_XYZ',
  });
  assert.equal(valid.verified, true);
  assert.equal(valid.challenge, 'CHALLENGE_STRING_XYZ');

  // Mismatch token
  const invalid = verifyWhatsAppWebhookChallenge({
    'hub.mode': 'subscribe',
    'hub.verify_token': 'wrong_token',
    'hub.challenge': 'CHALLENGE_STRING_XYZ',
  });
  assert.equal(invalid.verified, false);
});

test('WhatsApp Service: parseWhatsAppWebhookPayload Meta format', () => {
  const metaPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '10987654321',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '15550234567', phone_number_id: '123456789' },
              statuses: [
                {
                  id: 'wamid.HBgMOTE5MDI1MzM1NzIwFQIAERgSRDMzRjBCRDk1RkU0NDg5',
                  status: 'delivered',
                  timestamp: '1731672000',
                  recipient_id: '919025335720',
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const parsed = parseWhatsAppWebhookPayload(metaPayload);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].status, 'DELIVERED');
  assert.equal(parsed[0].messageId, 'wamid.HBgMOTE5MDI1MzM1NzIwFQIAERgSRDMzRjBCRDk1RkU0NDg5');
  assert.equal(parsed[0].recipient, '919025335720');
  assert.ok(parsed[0].timestamp);
});

test('WhatsApp Service: parseWhatsAppWebhookPayload read & failed status', () => {
  const payloadRead = {
    entry: [
      {
        changes: [
          {
            value: {
              statuses: [
                {
                  id: 'wamid.read_test',
                  status: 'read',
                  timestamp: '1731672500',
                  recipient_id: '919025335720',
                },
              ],
            },
          },
        ],
      },
    ],
  };
  const parsedRead = parseWhatsAppWebhookPayload(payloadRead);
  assert.equal(parsedRead[0].status, 'READ');

  const payloadFailed = {
    entry: [
      {
        changes: [
          {
            value: {
              statuses: [
                {
                  id: 'wamid.fail_test',
                  status: 'failed',
                  timestamp: '1731672600',
                  recipient_id: '919025335720',
                  errors: [{ title: 'Recipient phone number not valid for WhatsApp', code: 131026 }],
                },
              ],
            },
          },
        ],
      },
    ],
  };
  const parsedFailed = parseWhatsAppWebhookPayload(payloadFailed);
  assert.equal(parsedFailed[0].status, 'FAILED');
  assert.match(parsedFailed[0].error, /Recipient phone number not valid/);
});

test('WhatsApp Service: shouldUpdateStatus precedence', () => {
  assert.equal(shouldUpdateStatus('NOT_SENT', 'SENT'), true);
  assert.equal(shouldUpdateStatus('SENT', 'DELIVERED'), true);
  assert.equal(shouldUpdateStatus('DELIVERED', 'READ'), true);

  // Regressions must be blocked
  assert.equal(shouldUpdateStatus('DELIVERED', 'SENT'), false);
  assert.equal(shouldUpdateStatus('READ', 'DELIVERED'), false);

  // Idempotent duplicate events allowed
  assert.equal(shouldUpdateStatus('DELIVERED', 'DELIVERED'), true);

  // Failure always recorded
  assert.equal(shouldUpdateStatus('SENT', 'FAILED'), true);
});
