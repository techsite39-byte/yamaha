import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import {
  applyWhatsAppDeliveryToBooking,
  parseWhatsAppWebhookPayload,
  shouldUpdateStatus,
} from './whatsappService.js';
import { createWhatsAppWebhookRouter } from './whatsappWebhookRoutes.js';
import { createWhatsAppWebhookStore, ensureWhatsAppWebhookIndexes } from './whatsappWebhookStore.js';
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

test('FAILED is terminal and is accepted only from NOT_SENT, QUEUED, or SENT', () => {
  assert.equal(shouldUpdateStatus('NOT_SENT', 'FAILED'), true);
  assert.equal(shouldUpdateStatus('QUEUED', 'FAILED'), true);
  assert.equal(shouldUpdateStatus('SENT', 'FAILED'), true);
  assert.equal(shouldUpdateStatus('DELIVERED', 'FAILED'), false);
  assert.equal(shouldUpdateStatus('READ', 'FAILED'), false);
  assert.equal(shouldUpdateStatus('FAILED', 'SENT'), false);
  assert.equal(shouldUpdateStatus('FAILED', 'DELIVERED'), false);
  assert.equal(shouldUpdateStatus(undefined, 'FAILED'), false);

  const booking = { whatsappStatus: 'SENT' };
  assert.equal(applyWhatsAppDeliveryToBooking(booking, {
    status: 'FAILED',
    timestamp: '2026-11-17T00:00:00.000Z',
  }, '2026-11-17T00:00:01.000Z'), true);
  assert.equal(booking.whatsappError, 'Delivery failed.');
  assert.equal(applyWhatsAppDeliveryToBooking(booking, {
    status: 'DELIVERED',
    timestamp: '2026-11-17T00:00:02.000Z',
  }), false);
  assert.equal(booking.whatsappStatus, 'FAILED');
});

test('inbound messages and delivery statuses normalize to allowlisted metadata', () => {
  const payload = {
    entry: [{
      id: 'expected-business-account',
      changes: [{
        value: {
          messages: [
            { id: 'wamid.text', from: '919876543210', timestamp: '1731672000', type: 'text', text: { body: 'private text' } },
            { id: 'wamid.image', from: '919876543210', timestamp: '1731672001', type: 'image', image: { id: 'private-media-id', caption: 'private caption' } },
            { id: 'wamid.document', from: '919876543210', timestamp: '1731672002', type: 'document', document: { id: 'private-document-id', filename: 'private.pdf' } },
          ],
          statuses: ['sent', 'delivered', 'read', 'failed'].map((status, index) => ({
            id: `wamid.status-${index}`,
            status,
            timestamp: String(1731672010 + index),
            recipient_id: '919876543210',
            errors: [{ title: 'private provider error' }],
          })),
        },
      }],
    }, {
      id: 'unrelated-business-account',
      changes: [{ value: { messages: [{ id: 'wamid.ignored', from: '919876543210', type: 'text' }] } }],
    }],
  };
  const events = parseWhatsAppWebhookPayload(payload, { businessAccountId: 'expected-business-account' });
  assert.deepEqual(events.map(({ type, status, direction }) => [type, status, direction]), [
    ['text', 'RECEIVED', 'inbound'],
    ['image', 'RECEIVED', 'inbound'],
    ['document', 'RECEIVED', 'inbound'],
    ['status', 'SENT', 'outbound'],
    ['status', 'DELIVERED', 'outbound'],
    ['status', 'READ', 'outbound'],
    ['status', 'FAILED', 'outbound'],
  ]);
  const serialized = JSON.stringify(events);
  for (const privateValue of ['private text', 'private caption', 'private-media-id', 'private-document-id', 'private.pdf', 'private provider error']) {
    assert.equal(serialized.includes(privateValue), false);
  }
  assert.deepEqual(Object.keys(events[0]), [
    'messageId',
    'customerPhone',
    'type',
    'timestamp',
    'status',
    'direction',
    'processingStatus',
  ]);
});

test('temporary JSON storage deduplicates messages and stores only metadata', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'whatsapp-webhook-json-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const filePath = join(directory, 'messages.json');
  const store = createWhatsAppWebhookStore({ filePath });
  const event = {
    messageId: 'wamid.json-contract',
    customerPhone: '919876543210',
    type: 'text',
    timestamp: '2026-11-17T00:00:00.000Z',
    status: 'RECEIVED',
    direction: 'inbound',
    processingStatus: 'processed',
    text: 'must not be persisted',
    raw: { body: 'must not be persisted' },
  };

  await store.persist(event);
  await store.persist(event);
  const saved = JSON.parse(await readFile(filePath, 'utf8'));
  assert.equal(saved.length, 1);
  assert.deepEqual(Object.keys(saved[0]), [
    'messageId',
    'customerPhone',
    'type',
    'timestamp',
    'status',
    'direction',
    'processingStatus',
  ]);
});

test('Mongo collection contract creates a unique key and applies status transitions by compare-and-set', async () => {
  const documents = [];
  let indexOptions;
  const matches = (document, query) => Object.entries(query).every(([key, value]) => {
    if (value && typeof value === 'object' && '$exists' in value) return (key in document) === value.$exists;
    return document[key] === value;
  });
  const collection = {
    async createIndex(fields, options) {
      indexOptions = { fields, options };
    },
    async findOne(query) {
      const document = documents.find((item) => matches(item, query));
      return document ? structuredClone(document) : null;
    },
    async insertOne(document) {
      if (documents.some((item) => item.messageId === document.messageId)) {
        const error = new Error('duplicate key');
        error.code = 11000;
        throw error;
      }
      documents.push(structuredClone(document));
    },
    async updateOne(query, update) {
      const document = documents.find((item) => matches(item, query));
      if (!document) return { matchedCount: 0 };
      Object.assign(document, structuredClone(update.$set));
      return { matchedCount: 1 };
    },
  };
  await ensureWhatsAppWebhookIndexes(collection);
  assert.deepEqual(indexOptions, { fields: { messageId: 1 }, options: { unique: true } });
  const store = createWhatsAppWebhookStore({ getCollection: () => collection });
  const event = (messageId, status, timestamp) => ({
    messageId,
    customerPhone: '919876543210',
    type: 'status',
    timestamp,
    status,
    direction: 'outbound',
    processingStatus: 'processed',
  });

  await store.persist(event('wamid.mongo-forward', 'SENT', '2026-11-17T00:00:00.000Z'));
  await store.persist(event('wamid.mongo-forward', 'DELIVERED', '2026-11-17T00:00:01.000Z'));
  await store.persist(event('wamid.mongo-forward', 'SENT', '2026-11-17T00:00:02.000Z'));
  await store.persist(event('wamid.mongo-forward', 'FAILED', '2026-11-17T00:00:03.000Z'));
  assert.equal(documents.find((item) => item.messageId === 'wamid.mongo-forward').status, 'DELIVERED');

  await store.persist(event('wamid.mongo-failed', 'SENT', '2026-11-17T00:00:04.000Z'));
  await store.persist(event('wamid.mongo-failed', 'FAILED', '2026-11-17T00:00:05.000Z'));
  await store.persist(event('wamid.mongo-failed', 'READ', '2026-11-17T00:00:06.000Z'));
  assert.equal(documents.length, 2);
  assert.equal(documents.find((item) => item.messageId === 'wamid.mongo-failed').status, 'FAILED');
});

test('store failures return and log generic webhook errors without reaching global error middleware', async (t) => {
  const privateValues = ['wamid.private-error', '919876543210', 'booking-private-ref', 'private message text'];
  const logged = [];
  let globalErrorHandlerCalled = false;
  const router = createWhatsAppWebhookRouter({
    store: { async persist() { throw new Error(privateValues.join(' ')); } },
    getAppSecret: () => TEST_SECRET,
    getBusinessAccountId: () => '',
    logger: { error(message) { logged.push(message); } },
  });
  const app = express();
  app.use('/api/whatsapp/webhook', router);
  app.use((error, request, response, next) => {
    globalErrorHandlerCalled = true;
    return response.status(500).end();
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
    server.closeAllConnections?.();
  }));
  const rawBody = Buffer.from(JSON.stringify({
    entry: [{
      id: 'test-business-account',
      changes: [{ value: { messages: [{
        id: privateValues[0],
        from: privateValues[1],
        timestamp: '1731672000',
        type: 'text',
        text: { body: privateValues[3] },
      }] } }],
    }],
  }));
  const signature = `sha256=${createHmac('sha256', TEST_SECRET).update(rawBody).digest('hex')}`;
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/whatsapp/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': signature },
    body: rawBody,
  });
  const responseText = await response.text();
  assert.equal(response.status, 500);
  assert.equal(responseText, '{"error":"Webhook processing failed."}');
  assert.equal(globalErrorHandlerCalled, false);
  assert.deepEqual(logged, ['WhatsApp webhook processing failed.']);
  for (const privateValue of privateValues) {
    assert.equal(responseText.includes(privateValue), false);
    assert.equal(logged.join(' ').includes(privateValue), false);
  }
});
