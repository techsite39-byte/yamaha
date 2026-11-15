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

test('WhatsApp Integration: Full delivery lifecycle and status transitions', async (t) => {
  // 1. Initial State
  const booking = {
    reference: 'VM261115-TEST01',
    model: 'Yamaha MT-15 Version 2.0',
    variant: 'Standard',
    customer: {
      name: 'Naveen Eswaran',
      phone: '9025335720',
    },
    appointmentDate: '2026-11-20',
    appointmentTime: 'Morning Slot',
    whatsappStatus: 'NOT_SENT',
    whatsappMessageId: null,
    whatsappRecipient: '9025335720',
    whatsappSentAt: null,
    whatsappDeliveredAt: null,
    whatsappReadAt: null,
    whatsappFailedAt: null,
    whatsappError: null,
  };

  assert.equal(booking.whatsappStatus, 'NOT_SENT');
  assert.equal(booking.whatsappMessageId, null);

  // 2. Dispatch via simulated provider (e.g. Meta Cloud API acceptance)
  process.env.WHATSAPP_SIMULATE_DELIVERY = 'true';
  const sendResult = await sendWhatsAppMessage({ booking });
  delete process.env.WHATSAPP_SIMULATE_DELIVERY;

  assert.equal(sendResult.success, true);
  assert.equal(sendResult.status, 'SENT');
  assert.ok(sendResult.messageId);
  assert.equal(sendResult.recipient, '919025335720');

  // Update booking as backend would
  booking.whatsappStatus = sendResult.status;
  booking.whatsappMessageId = sendResult.messageId;
  booking.whatsappRecipient = sendResult.recipient;
  booking.whatsappSentAt = sendResult.sentAt;

  assert.equal(booking.whatsappStatus, 'SENT');
  assert.ok(booking.whatsappMessageId.startsWith('wamid.'));

  // 3. Webhook Delivery Event Simulation
  const deliveryWebhookPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '123456789',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              statuses: [
                {
                  id: booking.whatsappMessageId,
                  status: 'delivered',
                  timestamp: '1731673000',
                  recipient_id: '919025335720',
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const deliveryEvents = parseWhatsAppWebhookPayload(deliveryWebhookPayload);
  assert.equal(deliveryEvents.length, 1);
  assert.equal(deliveryEvents[0].status, 'DELIVERED');
  assert.equal(deliveryEvents[0].messageId, booking.whatsappMessageId);

  // Apply delivery transition
  assert.ok(shouldUpdateStatus(booking.whatsappStatus, deliveryEvents[0].status));
  booking.whatsappStatus = deliveryEvents[0].status;
  booking.whatsappDeliveredAt = deliveryEvents[0].timestamp;
  assert.equal(booking.whatsappStatus, 'DELIVERED');

  // 4. Duplicate Event Idempotency Check
  // If provider resends SENT status event after delivery, it must NOT regress status
  const duplicateSentPayload = {
    entry: [
      {
        changes: [
          {
            value: {
              statuses: [
                {
                  id: booking.whatsappMessageId,
                  status: 'sent',
                  timestamp: '1731672900',
                  recipient_id: '919025335720',
                },
              ],
            },
          },
        ],
      },
    ],
  };
  const duplicateSentEvents = parseWhatsAppWebhookPayload(duplicateSentPayload);
  assert.equal(shouldUpdateStatus(booking.whatsappStatus, duplicateSentEvents[0].status), false, 'Must not regress DELIVERED back to SENT');

  // 5. Read Receipt Webhook Simulation
  const readWebhookPayload = {
    entry: [
      {
        changes: [
          {
            value: {
              statuses: [
                {
                  id: booking.whatsappMessageId,
                  status: 'read',
                  timestamp: '1731673500',
                  recipient_id: '919025335720',
                },
              ],
            },
          },
        ],
      },
    ],
  };
  const readEvents = parseWhatsAppWebhookPayload(readWebhookPayload);
  assert.equal(readEvents.length, 1);
  assert.equal(readEvents[0].status, 'READ');
  assert.ok(shouldUpdateStatus(booking.whatsappStatus, readEvents[0].status));
  booking.whatsappStatus = readEvents[0].status;
  booking.whatsappReadAt = readEvents[0].timestamp;
  assert.equal(booking.whatsappStatus, 'READ');

  // 6. Webhook Challenge Verification Test
  process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'vathilai_yamaha_secure_token';
  const challengeCheck = verifyWhatsAppWebhookChallenge({
    'hub.mode': 'subscribe',
    'hub.verify_token': 'vathilai_yamaha_secure_token',
    'hub.challenge': 'CHALLENGE_ACCEPTED_999',
  });
  assert.equal(challengeCheck.verified, true);
  assert.equal(challengeCheck.challenge, 'CHALLENGE_ACCEPTED_999');

  // 7. Security: Verify Dealership Number is NEVER Used as Recipient
  const dealershipBooking = {
    reference: 'VM261115-ADMIN',
    customer: {
      name: 'Showroom Admin',
      phone: '081444 45566', // Dealership phone
    },
  };
  const dealershipSend = await sendWhatsAppMessage({ booking: dealershipBooking });
  assert.equal(dealershipSend.success, false);
  assert.equal(dealershipSend.status, 'FAILED');
  assert.match(dealershipSend.error, /dealership own phone number/);
});
