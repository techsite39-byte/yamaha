/**
 * WhatsApp Messaging & Webhook Delivery Service
 * Vathilai Motors — Authorised Yamaha Dealer
 */

export const DEALERSHIP_PHONES = [
  '8144445566',
  '08144445566',
  '918144445566',
  '+918144445566',
  '081444 45566',
];

export const STATUS_PRECEDENCE = {
  NOT_SENT: 0,
  QUEUED: 1,
  SENT: 2,
  DELIVERED: 3,
  READ: 4,
  FAILED: -1,
};

/**
 * Normalizes and validates an Indian mobile number.
 * Ensures the recipient is a real customer phone number and never the dealership.
 *
 * @param {string|number} rawPhone
 * @returns {{ valid: boolean, e164?: string, international?: string, local?: string, error?: string }}
 */
export function normalizeWhatsAppNumber(rawPhone) {
  if (!rawPhone) {
    return { valid: false, error: 'Customer phone number is required.' };
  }

  // Convert to string and strip non-digit characters
  let digits = String(rawPhone).replace(/\D/g, '');

  // Strip leading zeros
  while (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  let local = '';
  let international = '';
  let e164 = '';

  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    local = digits;
    international = `91${digits}`;
    e164 = `+91${digits}`;
  } else if (digits.length === 12 && digits.startsWith('91') && /^[6-9]\d{9}$/.test(digits.slice(2))) {
    local = digits.slice(2);
    international = digits;
    e164 = `+${digits}`;
  } else {
    return {
      valid: false,
      error: `Invalid Indian mobile number "${rawPhone}". Must be a 10-digit number starting with 6, 7, 8, or 9.`,
    };
  }

  // Guard against sending messages to dealership's own phone number
  const isDealership = DEALERSHIP_PHONES.some((dp) => {
    const dpClean = dp.replace(/\D/g, '').replace(/^0+/, '');
    return dpClean === local || dpClean === international;
  });

  if (isDealership) {
    return {
      valid: false,
      error: 'Cannot dispatch message to dealership own phone number. Recipient must be a customer.',
    };
  }

  return {
    valid: true,
    local,
    international,
    e164,
  };
}

/**
 * Formats standard booking confirmation text for WhatsApp.
 *
 * @param {object} booking
 * @returns {string}
 */
export function formatBookingWhatsAppText(booking) {
  const customer = booking.customer || {};
  const customerName = (customer.name || booking.name || 'Valued Customer').trim();
  const phone = customer.phone || booking.phone || '';
  const ref = booking.reference ?? booking.bookingReference ?? booking.id ?? '';
  const model = booking.model || booking.motorcycleModel || booking.motorcycleId || 'Yamaha Motorcycle';
  const variant = booking.variant || 'Standard';
  const slot = booking.appointmentTime || booking.preferredSlot || booking.slot || 'Flexible';
  const date = booking.appointmentDate || 'Soon';

  const priceText = booking.priceSnapshot?.exShowroom
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
        booking.priceSnapshot.exShowroom,
      )
    : (booking.priceSnapshot?.estimatedPrice ? `₹${booking.priceSnapshot.estimatedPrice}` : 'Price on request');

  return [
    `🏍️ *VATHILAI MOTORS — YAMAHA BOOKING CONFIRMATION*`,
    ``,
    `Dear *${customerName}*,`,
    `Thank you for booking with *Vathilai Motors*! Our team has received your enquiry and will shortly consider and contact you.`,
    ``,
    `📋 *Booking Details:*`,
    `• *Reference ID:* ${ref}`,
    `• *Motorcycle:* ${model}`,
    `• *Variant:* ${variant}`,
    `• *Ex-Showroom Price:* ${priceText}`,
    `• *Customer Name:* ${customerName}`,
    `• *Mobile Number:* ${phone}`,
    `• *Dealership:* Vathilai Motors — Batlagundu`,
    `• *Appointment Date:* ${date}`,
    `• *Time Slot:* ${slot}`,
    ``,
    `📍 *Dealership Location:*`,
    `Parimalam Theatre Complex, Main Road, Opp. Union Office Madurai, Batlagundu, Dindigul, Tamil Nadu – 624202.`,
    `📞 *Dealership Contact:* 081444 45566`,
    ``,
    `Thank you for choosing Yamaha & Vathilai Motors!`,
  ].join('\n');
}

/**
 * Sends a WhatsApp message via WhatsApp Cloud API or configured provider.
 * Strictly respects real status definitions:
 * - SENT only after provider returns a valid message ID.
 * - FAILED if provider rejects or credentials missing.
 *
 * @param {object} options
 * @param {object} options.booking
 * @param {string} [options.customPhone]
 * @param {string} [options.customMessage]
 * @returns {Promise<{ success: boolean, status: string, messageId?: string, recipient: string, sentAt?: string, failedAt?: string, error?: string, provider?: string }>}
 */
export async function sendWhatsAppMessage({ booking, customPhone, customMessage }) {
  const customer = booking.customer || {};
  const targetPhone = customPhone || customer.phone || booking.phone;

  const normalized = normalizeWhatsAppNumber(targetPhone);
  if (!normalized.valid) {
    return {
      success: false,
      status: 'FAILED',
      recipient: String(targetPhone || ''),
      error: normalized.error,
      failedAt: new Date().toISOString(),
      provider: 'none',
    };
  }

  const messageText = customMessage || formatBookingWhatsAppText(booking);
  const now = new Date().toISOString();

  // 1. Meta WhatsApp Cloud API configuration
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_API_KEY;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';

  // 2. Generic / Webhook provider configuration (optional secondary provider)
  const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL || process.env.WHATSAPP_API_URL;

  // 3. Simulated delivery provider for local testing / automated tests
  const simulateDelivery = process.env.WHATSAPP_SIMULATE_DELIVERY === 'true';

  if (phoneNumberId && accessToken) {
    try {
      const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalized.international,
          type: 'text',
          text: {
            preview_url: false,
            body: messageText,
          },
        }),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg =
          responseData?.error?.message ||
          responseData?.error?.error_user_msg ||
          `Provider rejected with HTTP ${response.status}`;
        console.error(`[WhatsApp Service] Meta Cloud API Error (${response.status}):`, responseData);
        return {
          success: false,
          status: 'FAILED',
          recipient: normalized.international,
          error: errorMsg,
          failedAt: now,
          provider: 'meta_cloud_api',
        };
      }

      const messageId = responseData?.messages?.[0]?.id;
      if (!messageId) {
        return {
          success: false,
          status: 'FAILED',
          recipient: normalized.international,
          error: 'Provider response did not contain a valid WhatsApp message ID.',
          failedAt: now,
          provider: 'meta_cloud_api',
        };
      }

      return {
        success: true,
        status: 'SENT',
        messageId,
        recipient: normalized.international,
        sentAt: now,
        provider: 'meta_cloud_api',
      };
    } catch (networkError) {
      console.error(`[WhatsApp Service] Network error dispatching to Meta API:`, networkError);
      return {
        success: false,
        status: 'FAILED',
        recipient: normalized.international,
        error: `Network error connecting to WhatsApp API: ${networkError.message}`,
        failedAt: now,
        provider: 'meta_cloud_api',
      };
    }
  }

  // Secondary Provider: Webhook Gateway
  if (webhookUrl) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          phone: normalized.international,
          e164: normalized.e164,
          message: messageText,
          reference: booking.reference,
          customerName: customer.name,
          model: booking.model,
          variant: booking.variant,
        }),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          status: 'FAILED',
          recipient: normalized.international,
          error: responseData?.error || `Gateway returned HTTP ${response.status}`,
          failedAt: now,
          provider: 'gateway_webhook',
        };
      }

      const messageId = responseData?.messageId || responseData?.id || responseData?.messages?.[0]?.id;
      if (messageId) {
        return {
          success: true,
          status: 'SENT',
          messageId,
          recipient: normalized.international,
          sentAt: now,
          provider: 'gateway_webhook',
        };
      }

      return {
        success: false,
        status: 'FAILED',
        recipient: normalized.international,
        error: 'Gateway did not return a valid WhatsApp message ID.',
        failedAt: now,
        provider: 'gateway_webhook',
      };
    } catch (err) {
      return {
        success: false,
        status: 'FAILED',
        recipient: normalized.international,
        error: `Gateway connection failed: ${err.message}`,
        failedAt: now,
        provider: 'gateway_webhook',
      };
    }
  }

  // Simulated provider (only active if explicitly enabled in environment, e.g. for CI/unit testing)
  if (simulateDelivery) {
    const mockMessageId = `wamid.HBgMOTE${normalized.local}VATHILAI${Date.now()}`;
    return {
      success: true,
      status: 'SENT',
      messageId: mockMessageId,
      recipient: normalized.international,
      sentAt: now,
      provider: 'simulated_test_provider',
    };
  }

  // Provider not configured - return honest FAILED status with clear message
  return {
    success: false,
    status: 'FAILED',
    recipient: normalized.international,
    error:
      'WhatsApp Cloud API credentials not configured. Please add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID to server/.env',
    failedAt: now,
    provider: 'unconfigured',
  };
}

/**
 * Verifies webhook challenge from Meta / WhatsApp.
 *
 * @param {object} query - req.query
 * @returns {{ verified: boolean, challenge?: string, error?: string }}
 */
export function verifyWhatsAppWebhookChallenge(query) {
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];

  const expectedToken =
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
    process.env.WHATSAPP_VERIFY_TOKEN ||
    'vathilai_yamaha_webhook_secret';

  if (mode === 'subscribe' && token === expectedToken) {
    return { verified: true, challenge };
  }

  return {
    verified: false,
    error: 'Webhook verification token mismatch or invalid mode.',
  };
}

/**
 * Parses incoming webhook body into standardized status event objects.
 * Handles Meta Cloud API format (entry[].changes[].value.statuses[])
 * and generic status callbacks.
 *
 * @param {object} body - req.body
 * @returns {Array<{ messageId: string, status: 'SENT'|'DELIVERED'|'READ'|'FAILED', recipient?: string, timestamp: string, error?: string, raw?: any }>}
 */
export function parseWhatsAppWebhookPayload(body) {
  const events = [];

  if (!body || typeof body !== 'object') {
    return events;
  }

  // Meta Cloud API Webhook Format
  if (Array.isArray(body.entry)) {
    for (const entry of body.entry) {
      if (!Array.isArray(entry.changes)) continue;

      for (const change of entry.changes) {
        const value = change.value;
        if (!value) continue;

        // Message status updates
        if (Array.isArray(value.statuses)) {
          for (const statusObj of value.statuses) {
            const rawStatus = String(statusObj.status || '').toLowerCase();
            let mappedStatus = null;

            if (rawStatus === 'sent') mappedStatus = 'SENT';
            else if (rawStatus === 'delivered') mappedStatus = 'DELIVERED';
            else if (rawStatus === 'read') mappedStatus = 'READ';
            else if (rawStatus === 'failed') mappedStatus = 'FAILED';

            if (mappedStatus && statusObj.id) {
              const timestamp = statusObj.timestamp
                ? new Date(Number(statusObj.timestamp) * 1000).toISOString()
                : new Date().toISOString();

              let errorText = null;
              if (Array.isArray(statusObj.errors) && statusObj.errors.length > 0) {
                errorText = statusObj.errors.map((e) => e.title || e.message || JSON.stringify(e)).join('; ');
              }

              events.push({
                messageId: statusObj.id,
                status: mappedStatus,
                recipient: statusObj.recipient_id,
                timestamp,
                error: errorText,
                raw: statusObj,
              });
            }
          }
        }
      }
    }
  }

  // Generic flat payload support (e.g. { messageId: '...', status: 'DELIVERED', timestamp: '...' })
  if (events.length === 0 && (body.messageId || body.id)) {
    const rawStatus = String(body.status || '').toUpperCase();
    if (['SENT', 'DELIVERED', 'READ', 'FAILED'].includes(rawStatus)) {
      events.push({
        messageId: body.messageId || body.id,
        status: rawStatus,
        recipient: body.recipient || body.phone,
        timestamp: body.timestamp || new Date().toISOString(),
        error: body.error || null,
        raw: body,
      });
    }
  }

  return events;
}

/**
 * Determines whether a new status update is a valid forward progression
 * or idempotent update, preventing regressions (e.g. duplicate SENT overwriting DELIVERED).
 *
 * @param {string} currentStatus
 * @param {string} newStatus
 * @returns {boolean}
 */
export function shouldUpdateStatus(currentStatus, newStatus) {
  if (!currentStatus || currentStatus === 'NOT_SENT') return true;
  if (currentStatus === newStatus) return true; // Safe idempotent update for timestamp/audit
  if (newStatus === 'FAILED') return true; // Failures are always recorded

  const currentLevel = STATUS_PRECEDENCE[currentStatus] ?? 0;
  const newLevel = STATUS_PRECEDENCE[newStatus] ?? 0;

  // Only allow forward progression (e.g. SENT -> DELIVERED -> READ)
  return newLevel > currentLevel;
}
