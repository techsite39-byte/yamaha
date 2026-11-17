import express from 'express';
import {
  parseWhatsAppWebhookPayload,
  verifyWhatsAppWebhookChallenge,
  verifyWhatsAppWebhookSignature,
} from './whatsappService.js';

const rawBodyParser = express.raw({
  type: () => true,
  limit: '10mb',
  inflate: false,
});

export function createWhatsAppWebhookRouter({
  store,
  updateBookingDelivery = async () => {},
  getAppSecret = () => process.env.WHATSAPP_APP_SECRET,
  getBusinessAccountId = () => process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  logger = console,
} = {}) {
  const router = express.Router();

  router.get('/', (request, response) => {
    const result = verifyWhatsAppWebhookChallenge(request.query);
    if (!result.verified) return response.status(403).json({ error: 'Verification failed.' });
    return response.status(200).send(result.challenge);
  });

  router.post('/', rawBodyParser, async (request, response) => {
    const rawBody = request.body;
    const signature = request.get('X-Hub-Signature-256');
    if (!verifyWhatsAppWebhookSignature(rawBody, signature, getAppSecret())) {
      return response.status(401).json({ error: 'Invalid signature.' });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return response.status(400).json({ error: 'Invalid webhook payload.' });
    }

    try {
      const events = parseWhatsAppWebhookPayload(payload, {
        businessAccountId: getBusinessAccountId(),
      });
      for (const event of events) {
        await store.persist(event);
        if (event.direction === 'outbound') {
          await updateBookingDelivery({
            messageId: event.messageId,
            status: event.status,
            timestamp: event.timestamp,
          });
        }
      }
      return response.status(200).json({ success: true, processed: events.length });
    } catch {
      logger.error?.('WhatsApp webhook processing failed.');
      return response.status(500).json({ error: 'Webhook processing failed.' });
    }
  });

  router.use((error, request, response, next) => {
    if (response.headersSent) return next(error);
    if (error?.type === 'entity.too.large') {
      return response.status(413).json({ error: 'Webhook payload is too large.' });
    }
    return response.status(400).json({ error: 'Invalid webhook request.' });
  });

  return router;
}
