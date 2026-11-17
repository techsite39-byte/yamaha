import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import express from 'express';
import { createWhatsAppWebhookRouter } from './whatsappWebhookRoutes.js';
import test from 'node:test';

const TEST_SECRET = 'test-only-whatsapp-app-secret';
const TEST_MESSAGE_ID = 'wamid.test-inbound-001';

test('a signed inbound text callback is verified before isolated persistence on either alias', async (t) => {
  const persisted = [];
  const store = {
    async persist(event) {
      persisted.push(event);
    },
  };
  const router = createWhatsAppWebhookRouter({
    store,
    getAppSecret: () => TEST_SECRET,
  });
  const app = express();
  app.use('/api/public/whatsapp/webhook', router);
  app.use('/api/whatsapp/webhook', router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
    server.closeAllConnections?.();
  }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const rawBody = Buffer.from(JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [{
      id: 'test-business-account',
      changes: [{
        field: 'messages',
        value: {
          messages: [{
            from: '919876543210',
            id: TEST_MESSAGE_ID,
            timestamp: '1731672000',
            type: 'text',
            text: { body: 'private message text' },
          }],
        },
      }],
    }],
  }));
  const signature = `sha256=${createHmac('sha256', TEST_SECRET).update(rawBody).digest('hex')}`;

  const invalid = await fetch(`${base}/api/public/whatsapp/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': 'sha256=invalid' },
    body: rawBody,
  });
  assert.equal(invalid.status, 401);
  assert.equal(persisted.length, 0);

  const valid = await fetch(`${base}/api/whatsapp/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': signature },
    body: rawBody,
  });
  assert.equal(valid.status, 200);
  assert.deepEqual(await valid.json(), { success: true, processed: 1 });
  assert.equal(persisted.length, 1);
  assert.deepEqual(persisted[0], {
    messageId: TEST_MESSAGE_ID,
    customerPhone: '919876543210',
    type: 'text',
    timestamp: new Date(1731672000 * 1000).toISOString(),
    status: 'RECEIVED',
    direction: 'inbound',
    processingStatus: 'processed',
  });
});
