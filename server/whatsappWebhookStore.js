import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { shouldUpdateStatus } from './whatsappService.js';

const OUTBOUND_STATUSES = new Set(['SENT', 'DELIVERED', 'READ', 'FAILED']);
const INBOUND_TYPES = new Set(['text', 'image', 'document']);
const MAX_STATUS_RETRIES = 5;

function safeEvent(event) {
  if (!event || typeof event.messageId !== 'string' || !event.messageId) {
    throw new TypeError('A webhook event message ID is required.');
  }
  if (!['inbound', 'outbound'].includes(event.direction)) {
    throw new TypeError('A webhook event direction is invalid.');
  }
  if (event.direction === 'inbound' && (!INBOUND_TYPES.has(event.type) || event.status !== 'RECEIVED')) {
    throw new TypeError('An inbound webhook event is invalid.');
  }
  if (event.direction === 'outbound' && (!OUTBOUND_STATUSES.has(event.status) || event.type !== 'status')) {
    throw new TypeError('An outbound webhook event is invalid.');
  }

  return {
    messageId: event.messageId,
    customerPhone: typeof event.customerPhone === 'string' ? event.customerPhone : '',
    type: event.type,
    timestamp: typeof event.timestamp === 'string' ? event.timestamp : new Date().toISOString(),
    status: event.status,
    direction: event.direction,
    processingStatus: 'processed',
  };
}

export async function ensureWhatsAppWebhookIndexes(collection) {
  await collection.createIndex({ messageId: 1 }, { unique: true });
}

async function readJson(filePath) {
  try {
    const contents = await readFile(filePath, 'utf8');
    const events = JSON.parse(contents);
    if (!Array.isArray(events)) throw new TypeError('Webhook event storage must contain an array.');
    return events;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function writeJson(filePath, events) {
  await mkdir(dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, `${JSON.stringify(events, null, 2)}\n`, {
      encoding: 'utf8',
      mode: 0o600,
    });
    await rename(temporaryPath, filePath);
  } finally {
    await unlink(temporaryPath).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
}

async function persistInMongo(collection, event) {
  for (let attempt = 0; attempt < MAX_STATUS_RETRIES; attempt += 1) {
    const existing = await collection.findOne({ messageId: event.messageId });
    if (!existing) {
      try {
        await collection.insertOne(event);
        return event;
      } catch (error) {
        if (error.code === 11000) continue;
        throw error;
      }
    }

    if (event.direction !== 'outbound' || existing.direction !== 'outbound') return existing;
    if (!shouldUpdateStatus(existing.status, event.status)) return existing;

    const result = await collection.updateOne(
      { messageId: event.messageId, status: existing.status },
      {
        $set: {
          timestamp: event.timestamp,
          status: event.status,
          processingStatus: 'processed',
        },
      },
    );
    if (result.matchedCount === 1) {
      return await collection.findOne({ messageId: event.messageId });
    }
  }

  throw new Error('Webhook message status could not be updated after bounded retries.');
}

export function createWhatsAppWebhookStore({ getCollection = () => null, filePath } = {}) {
  let mutationQueue = Promise.resolve();

  async function persistJson(event) {
    const events = await readJson(filePath);
    const existingIndex = events.findIndex((item) => item.messageId === event.messageId);
    if (existingIndex < 0) {
      events.push(event);
      await writeJson(filePath, events);
      return event;
    }

    const existing = events[existingIndex];
    if (event.direction === 'outbound'
      && existing.direction === 'outbound'
      && shouldUpdateStatus(existing.status, event.status)) {
      events[existingIndex] = {
        ...existing,
        timestamp: event.timestamp,
        status: event.status,
        processingStatus: 'processed',
      };
      await writeJson(filePath, events);
      return events[existingIndex];
    }
    return existing;
  }

  function persist(input) {
    const event = safeEvent(input);
    const operation = mutationQueue.then(async () => {
      const collection = getCollection();
      if (collection) return persistInMongo(collection, event);
      if (!filePath) throw new Error('Webhook JSON storage path is not configured.');
      return persistJson(event);
    });
    mutationQueue = operation.then(() => undefined, () => undefined);
    return operation;
  }

  return { persist };
}
