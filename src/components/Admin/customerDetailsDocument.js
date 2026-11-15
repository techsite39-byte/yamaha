function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function displayValue(value) {
  return value === undefined || value === null || value === '' ? 'Not provided' : value;
}

function safeMediaUrl(value) {
  return typeof value === 'string'
    && (value.startsWith('/') && !value.startsWith('//') || /^https:\/\//i.test(value))
    ? value
    : '';
}

function createDetailsDocument({ recordType, reference, heading, status, details, preview = '' }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'self' https: http: data:; media-src 'self' https: http:; base-uri 'none'; form-action 'none'">
    <title>${escapeHtml(recordType)} ${escapeHtml(displayValue(reference))}</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; padding: 22px; background: #f4f7fb; color: #172033; font: 14px/1.5 Manrope, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .summary { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; padding: 18px; border: 1px solid #dce5ef; border-radius: 12px; background: #fff; }
      .eyebrow { margin: 0 0 5px; color: #0879d1; font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
      h1 { margin: 0; font-size: 20px; line-height: 1.25; overflow-wrap: anywhere; }
      .reference { display: inline-block; margin-top: 6px; color: #748197; font: 12px/1.5 ui-monospace, SFMono-Regular, Consolas, monospace; overflow-wrap: anywhere; }
      .status { flex: 0 0 auto; padding: 5px 10px; border: 1px solid #bfdbfe; border-radius: 999px; background: #eff6ff; color: #07599c; font-size: 11px; font-weight: 800; text-transform: capitalize; }
      dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 0; }
      .field { min-width: 0; padding: 14px 16px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; }
      .field--wide { grid-column: 1 / -1; }
      .preview { margin-bottom: 14px; overflow: hidden; border: 1px solid #dce5ef; border-radius: 12px; background: #e8eef5; }
      .preview img { display: block; width: 100%; max-height: 260px; object-fit: cover; }
      .preview video { display: block; width: 100%; max-height: 300px; background: #080d16; }
      .preview-placeholder { display: grid; min-height: 120px; place-items: center; color: #748197; font-size: 12px; }
      dt { margin-bottom: 5px; color: #748197; font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
      dd { margin: 0; color: #172033; font-size: 13px; font-weight: 650; overflow-wrap: anywhere; white-space: pre-wrap; }
      @media (max-width: 560px) { body { padding: 12px; } .summary { padding: 14px; } dl { grid-template-columns: 1fr; gap: 9px; } .field--wide { grid-column: auto; } }
    </style>
  </head>
  <body>
    <header class="summary">
      <div>
        <p class="eyebrow">${escapeHtml(recordType)}</p>
        <h1>${escapeHtml(displayValue(heading))}</h1>
        <span class="reference">${escapeHtml(displayValue(reference))}</span>
      </div>
      <span class="status">${escapeHtml(displayValue(status || 'new'))}</span>
    </header>
    ${preview ? `<div class="preview">${preview}</div>` : ''}
    <dl>${details.map(([label, value]) => `<div class="field${label === 'Message' || label === 'Comment' || label === 'Caption' ? ' field--wide' : ''}"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(displayValue(value))}</dd></div>`).join('')}</dl>
  </body>
</html>`;
}

export function createBookingDetailsDocument(booking) {
  const customer = booking.customer || {};
  const reference = booking.reference ?? booking.bookingReference ?? booking.id;
  const phone = customer.phone || booking.phone;
  const waStatus = String(booking.whatsappStatus || (booking.whatsappMessageId ? 'SENT' : 'NOT_SENT')).toUpperCase();

  const details = [
    ['Customer', customer.name || booking.name],
    ['Phone', phone],
    ['WhatsApp Status', waStatus],
    ['WhatsApp Recipient', booking.whatsappRecipient || (phone ? `+91 ${phone}` : 'Not provided')],
    ['WhatsApp Message ID', booking.whatsappMessageId || undefined],
    ['WhatsApp Sent At', booking.whatsappSentAt || undefined],
    ['WhatsApp Delivered At', booking.whatsappDeliveredAt || undefined],
    ['WhatsApp Read At', booking.whatsappReadAt || undefined],
    ['WhatsApp Failure Reason', booking.whatsappError || undefined],
    ['Email', customer.email || booking.email],
    ['Motorcycle', booking.model || booking.motorcycleModel || booking.motorcycleId],
    ['Booking type', booking.type],
    ['Variant', booking.variant],
    ['Color', booking.color],
    ['Preferred slot', booking.slot || booking.preferredSlot || [booking.appointmentDate, booking.appointmentTime].filter(Boolean).join(' · ') || 'Flexible'],
    ['Dealership', customer.dealership || booking.dealership],
    ['City', customer.city || booking.city],
    ['State', customer.state || booking.state],
    ['Preferred contact', customer.preferredContactMethod || booking.preferredContactMethod],
    ['Status', booking.status || 'new'],
    ['Submitted', booking.createdAt],
    ['Message', customer.message || booking.message],
  ];

  return createDetailsDocument({
    recordType: 'Customer booking',
    reference,
    heading: customer.name || booking.name,
    status: booking.status,
    details,
  });
}

export function createEnquiryDetailsDocument(enquiry) {
  const customer = enquiry.customer || {};
  const reference = enquiry.reference ?? enquiry.id;
  const details = [
    ['Customer', customer.name || enquiry.name],
    ['Phone', customer.phone || enquiry.phone],
    ['Email', customer.email || enquiry.email],
    ['Motorcycle', enquiry.motorcycle?.model || enquiry.model],
    ['Variant', enquiry.variant],
    ['City', customer.city || enquiry.city],
    ['State', customer.state || enquiry.state],
    ['Dealership', customer.dealership || enquiry.dealership],
    ['Preferred contact', customer.preferredContactMethod || enquiry.preferredContactMethod],
    ['Received', enquiry.createdAt],
    ['Status', enquiry.status || 'new'],
    ['Message', customer.message || enquiry.message],
  ];

  return createDetailsDocument({
    recordType: 'Customer enquiry',
    reference,
    heading: customer.name || enquiry.name,
    status: enquiry.status,
    details,
  });
}

export function createReviewDetailsDocument(review) {
  const customerName = review.customerName || review.name;
  const bikeModel = review.model || review.bikeModel;
  const comment = review.review || review.comment;
  const published = review.published ?? (review.status === 'published');
  const reference = review.id;
  const details = [
    ['Customer', customerName],
    ['Rating', review.rating === undefined || review.rating === null ? undefined : `${review.rating} / 5`],
    ['Motorcycle', bikeModel],
    ['City', review.city],
    ['Review date', review.date || review.createdAt],
    ['Status', published ? 'Published' : 'Hidden'],
    ['Comment', comment],
  ];

  return createDetailsDocument({
    recordType: 'Customer review',
    reference,
    heading: customerName,
    status: published ? 'Published' : 'Hidden',
    details,
  });
}

export function createGalleryDetailsDocument(item) {
  const imageUrl = safeMediaUrl(item.imageUrl);
  const featured = Boolean(item.featured);
  const details = [
    ['Title', item.title],
    ['Category', item.category],
    ['Caption', item.caption],
    ['Alternative text', item.altText],
    ['Featured', featured ? 'Yes' : 'No'],
    ['Display order', item.displayOrder],
    ['Image URL', imageUrl || item.imageUrl],
  ];

  return createDetailsDocument({
    recordType: 'Gallery image',
    reference: item.id,
    heading: item.title,
    status: featured ? 'Featured' : 'Standard',
    details,
    preview: imageUrl
      ? `<img class="preview-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(displayValue(item.altText || item.title))}" referrerpolicy="no-referrer">`
      : '<div class="preview-placeholder">Image preview unavailable</div>',
  });
}

export function createVideoDetailsDocument(video) {
  const mediaUrl = video.mediaUrl || video.path;
  const safeUrl = safeMediaUrl(mediaUrl);
  const status = video.status || 'Not reported';
  const details = [
    ['Title', video.title || video.filename],
    ['Category', video.category],
    ['Description', video.description],
    ['Duration', video.duration],
    ['Display order', video.order],
    ['Status', status],
    ['File name', video.filename],
    ['Video path', safeUrl || mediaUrl],
  ];

  return createDetailsDocument({
    recordType: 'Service video',
    reference: video.id || video.filename,
    heading: video.title || video.filename,
    status,
    details,
    preview: safeUrl
      ? `<video src="${escapeHtml(safeUrl)}" controls playsinline preload="metadata" referrerpolicy="no-referrer"></video>`
      : '<div class="preview-placeholder">Video preview unavailable</div>',
  });
}

export function createMediaDetailsDocument(media) {
  const filename = media.filename || media.fileName || media.originalName;
  const url = media.url || media.filePath || media.fileUrl;
  const mediaType = media.type || media.mimeType || media.mediaType || '';
  const isVideo = String(mediaType).startsWith('video');
  const previewUrl = safeMediaUrl(url);
  const preview = previewUrl
    ? isVideo
      ? `<video src="${escapeHtml(previewUrl)}" controls playsinline preload="metadata" referrerpolicy="no-referrer"></video>`
      : `<img src="${escapeHtml(previewUrl)}" alt="${escapeHtml(displayValue(media.altText || filename))}" referrerpolicy="no-referrer">`
    : '<div class="preview-placeholder">Media preview unavailable</div>';
  const details = [
    ['File name', filename],
    ['Original file name', media.originalName],
    ['Media type', media.mimeType || media.type || media.mediaType],
    ['Category', media.category],
    ['Alternative text', media.altText],
    ['File size', typeof media.sizeBytes === 'number' ? `${(media.sizeBytes / 1024 / 1024).toFixed(2)} MB` : undefined],
    ['Uploaded', media.createdAt || media.uploadedAt],
    ['File URL', url],
  ];

  return createDetailsDocument({
    recordType: isVideo ? 'Video asset' : 'Image asset',
    reference: media.id || filename,
    heading: filename,
    status: media.category || 'Media file',
    details,
    preview,
  });
}

export function createWebsiteContentDetailsDocument(item) {
  const details = [
    ['Label', item.label],
    ['Content key', item.key],
    ['Section', item.section],
    ['Value', item.value],
  ];

  return createDetailsDocument({
    recordType: 'Website content',
    reference: item.key,
    heading: item.label || item.key,
    status: item.section || 'General',
    details,
  });
}

export function createHomeSlideDetailsDocument(slide) {
  const imageUrl = safeMediaUrl(slide.image);
  const details = [
    ['Slide number', slide.slideNumber],
    ['Headline', slide.title],
    ['Subtitle', slide.subtitle],
    ['Button link', slide.link],
    ['Image path', slide.image],
  ];

  return createDetailsDocument({
    recordType: 'Homepage slide',
    reference: `Slide ${displayValue(slide.slideNumber)}`,
    heading: slide.title,
    status: `Slide ${displayValue(slide.slideNumber)}`,
    details,
    preview: imageUrl
      ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(displayValue(slide.title))}" referrerpolicy="no-referrer">`
      : '<div class="preview-placeholder">Slide image preview unavailable</div>',
  });
}

export function createWebsiteSectionDetailsDocument(section) {
  const enabled = section.enabled === true;
  const details = [
    ['Section title', section.title],
    ['Description', section.subtitle],
    ['Display order', section.order],
    ['Visibility', enabled ? 'Visible' : 'Hidden'],
  ];

  return createDetailsDocument({
    recordType: 'Website section',
    reference: section.id,
    heading: section.title,
    status: enabled ? 'Visible' : 'Hidden',
    details,
  });
}
