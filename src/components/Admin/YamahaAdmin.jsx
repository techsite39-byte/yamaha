import React, { useEffect, useMemo, useState } from 'react';
import './YamahaAdmin.css';
import { AdminIcon } from './adminIcons.jsx';
import { navigation, pageTitles } from './adminNavigation.js';
import { requestJson, downloadCsv, uploadMediaBinary } from './adminApi.js';
import { createBookingDetailsDocument } from './customerDetailsDocument.js';
import {
  SectionIntro,
  SocialPlatformSummary,
  SocialMediaDashboard,
  SocialPosts,
  ContactEnquiries,
  CustomerReviews,
  GalleryManagement,
  WebsiteContent,
  HomePageEditor,
  WebsiteSections,
  MediaLibrary,
  AdminAnalytics,
  AdminProfileSettings,
  SeoSettings,
  UsersManagement,
  ActivityLogs,
  SiteSettings,
  ServiceVideosManagement,
} from './YamahaAdminSections.jsx';

function YamahaMark() {
  return (
    <svg viewBox="0 0 42 42" aria-hidden="true">
      <circle cx="21" cy="21" r="18" />
      <path d="M11 9.5 21 25l10-15.5v13c0 6-4.3 10-10 10s-10-4-10-10zM21 25V7" />
      <path d="M8 16h26" />
    </svg>
  );
}

function AdminLoading({ overview = false }) {
  return (
    <div className="admin-state" role="status">
      <div className="admin-state__spinner" style={{ width: 32, height: 32, border: '3px solid #cbd5e1', borderTopColor: '#0879D1', borderRadius: '50%', marginBottom: 12 }} />
      <strong>{overview ? 'Loading live overview…' : 'Loading admin data…'}</strong>
      <span>Waiting for the admin API to confirm the latest data.</span>
    </div>
  );
}

function AdminError({ message, onRetry }) {
  return (
    <div className="admin-state admin-state--error" role="alert">
      <strong>DATABASE CONNECTION ERROR</strong>
      <span style={{ margin: '8px 0 16px' }}>{message}</span>
      <button className="admin-button admin-button--primary" type="button" onClick={onRetry}>
        RETRY CONNECTION
      </button>
    </div>
  );
}

const catalogueCategories = ['Sport Bikes', 'Street Bikes', 'Naked Bikes', 'Hybrid Bikes', 'Scooters', 'Superbikes'];
const bookingStatuses = ['pending', 'contacted', 'confirmed', 'completed', 'cancelled'];

function createCatalogueDraft(catalogue = {}, motorcycle = {}) {
  const specs = Array.isArray(catalogue.specifications) ? catalogue.specifications : [];
  const findSpec = (keyword) => specs.find((s) => s.label.toLowerCase().includes(keyword.toLowerCase()))?.value || '';

  const prices = Array.isArray(catalogue.prices) && catalogue.prices.length > 0 ? catalogue.prices : [
    {
      variant: catalogue.variants?.[0] || 'Standard',
      city: 'Chennai',
      exShowroom: 150000,
      onRoad: 175000,
      source: 'Vathilai Motors Showroom',
      checkedAt: new Date().toISOString().slice(0, 10),
      estimated: true,
    },
  ];

  return {
    category: catalogue.category ?? 'Sport Bikes',
    market: catalogue.market ?? 'IN',
    published: catalogue.published !== false,
    available: catalogue.available !== false,
    featured: Boolean(catalogue.featured || motorcycle.featured),
    displacementCc: motorcycle.displacementCc || parseInt(findSpec('displacement') || findSpec('engine') || '0', 10) || '',
    power: motorcycle.specs?.power || findSpec('power') || '',
    torque: motorcycle.specs?.torque || findSpec('torque') || '',
    transmission: motorcycle.specs?.transmission || findSpec('transmission') || findSpec('gear') || 'Constant Mesh 6-speed',
    mileage: motorcycle.specs?.mileage || findSpec('mileage') || '',
    topSpeed: motorcycle.specs?.topSpeed || findSpec('speed') || '',
    variants: Array.isArray(catalogue.variants) && catalogue.variants.length > 0 ? [...catalogue.variants] : ['Standard'],
    colors: Array.isArray(catalogue.colors) && catalogue.colors.length > 0 ? [...catalogue.colors] : ['Racing Blue', 'Tech Black'],
    specifications: specs.map((row) => ({ section: row.section ?? '', label: row.label ?? '', value: row.value ?? '' })),
    prices: prices.map((row) => ({
      variant: row.variant ?? '',
      city: row.city ?? 'Chennai',
      exShowroom: Number(row.exShowroom) || 0,
      onRoad: Number(row.onRoad) || 0,
      source: row.source ?? 'Vathilai Motors Showroom',
      checkedAt: row.checkedAt ?? new Date().toISOString().slice(0, 10),
      estimated: Boolean(row.estimated),
    })),
    gallery: Array.isArray(catalogue.gallery) ? [...catalogue.gallery] : [],
    officialSourceUrl: catalogue.officialSourceUrl ?? '',
    priceNote: catalogue.priceNote ?? 'Ex-showroom and on-road prices for Chennai showroom.',
  };
}

function MotorcycleEditor({ motorcycle, onClose, onSave, saving, error }) {
  const [draft, setDraft] = useState(() => ({
    model: motorcycle?.model ?? '',
    slug: motorcycle?.slug ?? (motorcycle?.id || ''),
    category: motorcycle?.category ?? 'SPORT',
    description: motorcycle?.description ?? '',
    cta: motorcycle?.cta ?? 'EXPLORE SPECIFICATIONS',
    image: motorcycle?.image ?? '/imgs/1.%20Yamaha%20YZF-R1.webp',
    catalogue: createCatalogueDraft(motorcycle?.catalogue, motorcycle),
  }));

  const [uploadTarget, setUploadTarget] = useState('main');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');

  const setCatalogueValue = (key, value) => setDraft((current) => ({
    ...current,
    catalogue: { ...current.catalogue, [key]: value },
  }));

  const updateList = (key, index, value) => setCatalogueValue(
    key,
    draft.catalogue[key].map((item, itemIndex) => (itemIndex === index ? value : item)),
  );

  const handlePriceChange = (field, value) => {
    const num = parseInt(value, 10) || 0;
    setDraft((curr) => {
      const updatedPrices = (curr.catalogue.prices || []).map((p, idx) =>
        idx === 0 ? { ...p, [field]: num } : p
      );
      if (!updatedPrices.length) {
        updatedPrices.push({
          variant: curr.catalogue.variants[0] || 'Standard',
          city: 'Chennai',
          exShowroom: field === 'exShowroom' ? num : 0,
          onRoad: field === 'onRoad' ? num : 0,
          source: 'Vathilai Motors Showroom',
          checkedAt: new Date().toISOString().slice(0, 10),
          estimated: true,
        });
      }
      return {
        ...curr,
        catalogue: { ...curr.catalogue, prices: updatedPrices },
      };
    });
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploadMessage('');
    if (!['image/webp', 'image/jpeg', 'image/png'].includes(file.type)) {
      setUploadError('Choose a WebP, JPEG, or PNG image.');
      event.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const uploaded = await uploadMediaBinary(file);
      if (uploadTarget === 'main') {
        setDraft((current) => ({ ...current, image: uploaded.url }));
      } else {
        setCatalogueValue('gallery', [...draft.catalogue.gallery, uploaded.url]);
      }
      setUploadMessage(`${file.name} uploaded successfully.`);
    } catch (uploadFailure) {
      setUploadError(uploadFailure.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const currentPrice = draft.catalogue.prices?.[0] || { exShowroom: 0, onRoad: 0 };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanCatalogue = {
      ...draft.catalogue,
      prices: (draft.catalogue.prices || []).map((p) => ({
        ...p,
        variant: p.variant || draft.catalogue.variants[0] || 'Standard',
        city: p.city || 'Chennai',
        source: p.source || 'Vathilai Motors Showroom',
        checkedAt: p.checkedAt || new Date().toISOString().slice(0, 10),
        estimated: true,
      })),
      variants: draft.catalogue.variants.filter((v) => v && v.trim()),
      colors: draft.catalogue.colors.filter((c) => c && c.trim()),
    };
    onSave({
      ...draft,
      catalogue: cleanCatalogue,
    });
  };

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="admin-modal-card admin-modal-card--wide" role="dialog" aria-modal="true" aria-labelledby="motorcycle-modal-title">
        <div className="admin-modal-heading">
          <div>
            <span className="admin-eyebrow">MOTORCYCLE INVENTORY</span>
            <h3 id="motorcycle-modal-title">{motorcycle ? `Edit ${motorcycle.model}` : 'Add New Motorcycle'}</h3>
          </div>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Close form">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Model Name <b aria-hidden="true">*</b></span>
              <input
                required
                maxLength="80"
                value={draft.model}
                placeholder="e.g. YZF-R7, YZF-R15 V4"
                onChange={(e) => setDraft((curr) => ({ ...curr, model: e.target.value }))}
              />
            </label>

            <label className="admin-field">
              <span>Slug / Identifier</span>
              <input
                maxLength="80"
                value={draft.slug}
                placeholder="e.g. yzf-r7, yamaha-r15"
                onChange={(e) => setDraft((curr) => ({ ...curr, slug: e.target.value }))}
              />
            </label>

            <label className="admin-field">
              <span>Catalogue Category <b aria-hidden="true">*</b></span>
              <select
                value={draft.catalogue.category}
                onChange={(e) => setCatalogueValue('category', e.target.value)}
              >
                {catalogueCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label className="admin-field">
              <span>Marketing Segment</span>
              <input
                maxLength="60"
                value={draft.category}
                placeholder="e.g. SUPERSPORT / RACE-BRED"
                onChange={(e) => setDraft((curr) => ({ ...curr, category: e.target.value }))}
              />
            </label>

            <label className="admin-field admin-field--full">
              <span>Model Description</span>
              <textarea
                rows="3"
                value={draft.description}
                placeholder="Official model overview and engineering highlights..."
                onChange={(e) => setDraft((curr) => ({ ...curr, description: e.target.value }))}
              />
            </label>

            {/* Technical Specifications */}
            <label className="admin-field">
              <span>Engine Displacement (cc)</span>
              <input
                type="number"
                min="0"
                value={draft.catalogue.displacementCc}
                placeholder="e.g. 689"
                onChange={(e) => setCatalogueValue('displacementCc', e.target.value)}
              />
            </label>

            <label className="admin-field">
              <span>Power Output</span>
              <input
                value={draft.catalogue.power}
                placeholder="e.g. 73.4 PS @ 8,750 rpm"
                onChange={(e) => setCatalogueValue('power', e.target.value)}
              />
            </label>

            <label className="admin-field">
              <span>Max Torque</span>
              <input
                value={draft.catalogue.torque}
                placeholder="e.g. 67.0 Nm @ 6,500 rpm"
                onChange={(e) => setCatalogueValue('torque', e.target.value)}
              />
            </label>

            <label className="admin-field">
              <span>Transmission</span>
              <input
                value={draft.catalogue.transmission}
                placeholder="e.g. Constant Mesh 6-speed"
                onChange={(e) => setCatalogueValue('transmission', e.target.value)}
              />
            </label>

            {/* Pricing Section */}
            <label className="admin-field">
              <span>Ex-Showroom Price (₹) <b aria-hidden="true">*</b></span>
              <input
                type="number"
                min="0"
                required
                value={currentPrice.exShowroom || ''}
                placeholder="e.g. 980000"
                onChange={(e) => handlePriceChange('exShowroom', e.target.value)}
              />
            </label>

            <label className="admin-field">
              <span>Estimated On-Road Price (₹)</span>
              <input
                type="number"
                min="0"
                value={currentPrice.onRoad || ''}
                placeholder="e.g. 1120000"
                onChange={(e) => handlePriceChange('onRoad', e.target.value)}
              />
            </label>

            {/* Image Preview & Upload */}
            <div className="admin-field admin-field--full">
              <span>Motorcycle Hero Image</span>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '6px' }}>
                <div style={{ width: 120, height: 80, background: '#1e293b', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px' }}>
                  <img src={draft.image} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    value={draft.image}
                    placeholder="/imgs/... or https://..."
                    onChange={(e) => setDraft((curr) => ({ ...curr, image: e.target.value }))}
                  />
                  <div style={{ marginTop: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label className="admin-button admin-button--secondary admin-button--sm">
                      <input type="file" accept="image/webp,image/jpeg,image/png" style={{ display: 'none' }} onChange={uploadImage} />
                      {uploading ? 'Uploading…' : 'Upload Image File'}
                    </label>
                    {uploadMessage && <small style={{ color: '#10b981' }}>{uploadMessage}</small>}
                    {uploadError && <small style={{ color: '#ef4444' }}>{uploadError}</small>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '12px' }}>{error}</p>}

          <div className="admin-modal-actions">
            <button type="button" className="admin-button admin-button--secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="admin-button admin-button--primary" disabled={saving}>
              {saving ? 'Saving to MongoDB…' : (motorcycle ? 'Save Changes' : 'Create Motorcycle')}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function MotorcyclesManagement({ motorcycles = [], onEdit, onDelete, query = '' }) {
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return motorcycles.filter((bike) => {
      const matchesCategory = categoryFilter === 'ALL' || bike.catalogue?.category === categoryFilter;
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery = !normalizedQuery || `${bike.model} ${bike.category} ${bike.id}`.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [motorcycles, categoryFilter, query]);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', ...catalogueCategories].map((cat) => (
            <button
              key={cat}
              type="button"
              className={`admin-button admin-button--sm ${categoryFilter === cat ? 'admin-button--primary' : 'admin-button--secondary'}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-motorcycles-grid">
        {filtered.map((bike) => {
          const price = bike.catalogue?.prices?.[0];
          return (
            <article className="admin-motorcycle-card" key={bike.id}>
              <div className="admin-motorcycle-card__thumb">
                <img src={bike.image} alt={bike.model} loading="lazy" />
              </div>
              <div className="admin-motorcycle-card__body">
                <span className="admin-eyebrow">{bike.catalogue?.category || 'SPORT'}</span>
                <h3 className="admin-motorcycle-card__title">{bike.model}</h3>
                <div className="admin-motorcycle-card__meta">
                  {bike.displacementCc ? `${bike.displacementCc} cc` : ''} · {bike.category}
                </div>
                <div className="admin-motorcycle-card__prices">
                  <span>Ex-Showroom:</span>
                  <strong>{price?.exShowroom ? `₹${price.exShowroom.toLocaleString('en-IN')}` : 'Price on request'}</strong>
                </div>
              </div>
              <div className="admin-motorcycle-card__actions">
                <button
                  type="button"
                  className="admin-button admin-button--secondary admin-button--sm"
                  style={{ flex: 1 }}
                  onClick={() => onEdit(bike)}
                >
                  Edit Details
                </button>
                <button
                  type="button"
                  className="admin-button admin-button--danger admin-button--sm"
                  onClick={() => onDelete(bike)}
                  aria-label={`Delete ${bike.model}`}
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="admin-state">
          <strong>No motorcycles found</strong>
          <span>Try adjusting your category filter or search query.</span>
        </div>
      )}
    </>
  );
}

function getAdminWhatsAppUrl(booking) {
  if (!booking) return '#';
  const customer = booking.customer || {};
  const rawPhone = String(customer.phone || booking.phone || '').replace(/[\s-]/g, '');
  const cleanPhone = rawPhone.startsWith('91') ? rawPhone : (rawPhone ? `91${rawPhone}` : '');
  if (!cleanPhone) return '#';

  const ref = booking.reference ?? booking.bookingReference ?? booking.id ?? '';
  const model = booking.model || booking.motorcycleModel || booking.motorcycleId || 'Yamaha Motorcycle';
  const variant = booking.variant || 'Standard';
  const name = customer.name || booking.name || 'Valued Customer';
  const date = booking.appointmentDate || 'Tomorrow';
  const slot = booking.appointmentTime || booking.preferredSlot || booking.slot || 'Flexible';
  const price = booking.priceSnapshot?.exShowroom
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(booking.priceSnapshot.exShowroom)
    : '';

  const message = [
    `🏍️ *VATHILAI MOTORS — YAMAHA BOOKING CONFIRMATION*`,
    ``,
    `Dear *${name}*,`,
    `Thank you for choosing *Vathilai Motors*! Our sales team has received your booking enquiry and will shortly assist you with priority showroom delivery and test ride scheduling.`,
    ``,
    `📋 *Booking Details:*`,
    `• *Booking Reference:* ${ref}`,
    `• *Motorcycle:* ${model}`,
    `• *Variant:* ${variant}`,
    price ? `• *Ex-Showroom Price:* ${price}` : null,
    `• *Customer Name:* ${name}`,
    `• *Contact Number:* ${customer.phone || booking.phone}`,
    `• *Dealership:* Vathilai Motors — Batlagundu`,
    `• *Appointment Date:* ${date}`,
    `• *Time Slot:* ${slot}`,
    ``,
    `📍 *Dealership Address:*`,
    `Parimalam Theatre Complex, Main Road, Opp. Union Office Madurai, Batlagundu, Dindigul, Tamil Nadu – 624202.`,
    `📞 *Dealership Contact:* 081444 45566`,
    ``,
    `Thank you for choosing Yamaha & Vathilai Motors!`,
  ].filter(Boolean).join('\n');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

function getWhatsAppStatusBadge(status) {
  const upper = String(status || 'NOT_SENT').toUpperCase();
  switch (upper) {
    case 'SENT':
      return { label: 'SENT', className: 'admin-badge--wa-sent' };
    case 'DELIVERED':
      return { label: 'DELIVERED', className: 'admin-badge--wa-delivered' };
    case 'READ':
      return { label: 'READ', className: 'admin-badge--wa-read' };
    case 'FAILED':
      return { label: 'FAILED', className: 'admin-badge--wa-failed' };
    case 'QUEUED':
      return { label: 'QUEUED', className: 'admin-badge--wa-queued' };
    case 'NOT_SENT':
    default:
      return { label: 'NOT SENT', className: 'admin-badge--wa-not-sent' };
  }
}

function BookingsManagement({ bookings = [], onUpdateStatus, onDelete, onSendWhatsApp, updates = {} }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    if (!selectedBooking) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedBooking(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedBooking]);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchesStatus = filter === 'all' || b.status === filter;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || `${b.customer?.name || b.name} ${b.customer?.phone || b.phone} ${b.model || ''} ${b.reference || ''}`.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [bookings, filter, search]);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['all', 'new', 'contacted', 'confirmed', 'converted', 'cancelled'].map((st) => (
            <button
              key={st}
              type="button"
              className={`admin-button admin-button--sm ${filter === st ? 'admin-button--primary' : 'admin-button--secondary'}`}
              onClick={() => setFilter(st)}
            >
              {st.toUpperCase()}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <label className="admin-search">
            <AdminIcon name="search" size={15} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bookings..."
            />
          </label>
          <button
            type="button"
            className="admin-button admin-button--secondary"
            onClick={() => downloadCsv('bookings-vathilai.csv', filtered, [
              { label: 'Reference', key: 'reference' },
              { label: 'Customer', getter: (b) => b.customer?.name || b.name },
              { label: 'Phone', getter: (b) => b.customer?.phone || b.phone },
              { label: 'Motorcycle', getter: (b) => b.model || b.motorcycleId },
              { label: 'Slot', getter: (b) => b.slot || b.preferredSlot || 'Flexible' },
              { label: 'WhatsApp Status', getter: (b) => String(b.whatsappStatus || (b.whatsappMessageId ? 'SENT' : 'NOT_SENT')).toUpperCase() },
              { label: 'Status', key: 'status' },
              { label: 'Date', key: 'createdAt' },
            ])}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Motorcycle Model</th>
              <th>Preferred Slot</th>
              <th>WhatsApp Status</th>
              <th>Status</th>
              <th>Update Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => {
              const ref = b.reference ?? b.bookingReference ?? b.id;
              const update = updates[ref] || {};
              const waStatus = String(b.whatsappStatus || (b.whatsappMessageId ? 'SENT' : 'NOT_SENT')).toUpperCase();
              const badge = getWhatsAppStatusBadge(waStatus);
              const isSending = Boolean(update.sendingWhatsApp);

              return (
                <tr key={ref}>
                  <td><code>{ref}</code></td>
                  <td><strong>{b.customer?.name || b.name}</strong></td>
                  <td><a href={`tel:${b.customer?.phone || b.phone}`}>{b.customer?.phone || b.phone}</a></td>
                  <td>{b.model || b.motorcycleId}</td>
                  <td><small>{b.slot || b.preferredSlot || 'Flexible'}</small></td>
                  <td>
                    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          className={`admin-badge ${badge.className}`}
                          title={b.whatsappError || (b.whatsappMessageId ? `Message ID: ${b.whatsappMessageId}` : undefined)}
                        >
                          {badge.label}
                        </span>
                        <button
                          type="button"
                          disabled={isSending}
                          onClick={() => onSendWhatsApp && onSendWhatsApp(b)}
                          className={`admin-button admin-button--sm ${waStatus === 'FAILED' ? 'admin-button--warning' : ''}`}
                          title={waStatus === 'FAILED' ? `Delivery failed: ${b.whatsappError || 'Error'}. Click to retry.` : 'Send WhatsApp booking confirmation'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            background: isSending ? '#9ca3af' : (waStatus === 'FAILED' ? '#ef4444' : '#25D366'),
                            color: '#ffffff',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '700',
                            border: 'none',
                            whiteSpace: 'nowrap',
                            cursor: isSending ? 'not-allowed' : 'pointer',
                            opacity: isSending ? 0.7 : 1,
                          }}
                        >
                          {isSending ? (
                            <span>⏳ Sending...</span>
                          ) : waStatus === 'FAILED' ? (
                            <span>🔄 Retry</span>
                          ) : waStatus === 'SENT' || waStatus === 'DELIVERED' || waStatus === 'READ' ? (
                            <span>💬 Resend</span>
                          ) : (
                            <span>💬 Send</span>
                          )}
                        </button>
                      </div>
                      {update.waError && (
                        <small style={{ color: '#dc2626', fontSize: '10px', maxWidth: '190px', lineHeight: '1.2' }}>
                          {update.waError}
                        </small>
                      )}
                      {!update.waError && b.whatsappError && waStatus === 'FAILED' && (
                        <small style={{ color: '#dc2626', fontSize: '10px', maxWidth: '190px', lineHeight: '1.2' }}>
                          {b.whatsappError}
                        </small>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`admin-badge ${b.status ? `admin-badge--${b.status}` : ''}`}>
                      {b.status || 'new'}
                    </span>
                  </td>
                  <td>
                    <select
                      value={b.status || 'new'}
                      disabled={update.saving}
                      onChange={(e) => onUpdateStatus(b, e.target.value)}
                      style={{ height: '32px', fontSize: '12px', padding: '0 8px' }}
                    >
                      {['new', 'contacted', 'confirmed', 'converted', 'cancelled'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className="admin-booking-actions">
                      <button
                        type="button"
                        className="admin-button admin-button--secondary admin-button--sm"
                        onClick={() => setSelectedBooking(b)}
                        aria-label={`View booking ${ref}`}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="admin-button admin-button--danger admin-button--sm"
                        onClick={() => onDelete(ref)}
                        aria-label={`Delete booking ${ref}`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="9" className="admin-table__empty">
                  No bookings found matching your filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedBooking && (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedBooking(null);
          }}
        >
          <section
            className="admin-modal-card admin-booking-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-details-title"
          >
            <div className="admin-modal-heading">
              <div>
                <span className="admin-eyebrow">BOOKING DETAILS</span>
                <h3 id="booking-details-title">
                  {selectedBooking.customer?.name || selectedBooking.name || 'Customer details'}
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  disabled={Boolean(updates[selectedBooking.reference ?? selectedBooking.id]?.sendingWhatsApp)}
                  onClick={async () => {
                    if (onSendWhatsApp) {
                      try {
                        const res = await onSendWhatsApp(selectedBooking);
                        if (res?.booking) setSelectedBooking(res.booking);
                      } catch {}
                    }
                  }}
                  className="admin-button admin-button--primary admin-button--sm"
                  style={{
                    background: '#25D366',
                    borderColor: '#25D366',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '700',
                    cursor: updates[selectedBooking.reference ?? selectedBooking.id]?.sendingWhatsApp ? 'not-allowed' : 'pointer',
                  }}
                  title="Dispatch official WhatsApp confirmation to customer via backend provider"
                >
                  <span>
                    {updates[selectedBooking.reference ?? selectedBooking.id]?.sendingWhatsApp
                      ? '⏳ Sending...'
                      : '💬 Send via WhatsApp'}
                  </span>
                </button>
                <a
                  href={getAdminWhatsAppUrl(selectedBooking)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-button admin-button--secondary admin-button--sm"
                  title="Open direct WhatsApp chat with customer"
                >
                  <span>Open Chat</span>
                </a>
                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={() => setSelectedBooking(null)}
                  aria-label="Close booking details"
                  autoFocus
                >
                  <AdminIcon name="close" size={16} />
                </button>
              </div>
            </div>
            <iframe
              className="admin-booking-details-frame"
              title={`Booking details for ${selectedBooking.customer?.name || selectedBooking.name || 'customer'}`}
              sandbox=""
              srcDoc={createBookingDetailsDocument(selectedBooking)}
            />
          </section>
        </div>
      )}
    </>
  );
}

function AdminDashboard({ overview = {}, onNavigate }) {
  const bCounts = overview.bookingStatusCounts || {};
  const primaryMetrics = [
    { label: 'Total motorcycles', value: overview.totalMotorcycles, icon: 'motorcycles', path: '/admin/motorcycles' },
    { label: 'Total bookings', value: overview.totalBookings, icon: 'bookings', path: '/admin/bookings' },
    { label: 'Pending bookings', value: overview.pendingBookings, icon: 'bookings', path: '/admin/bookings' },
    { label: 'Total enquiries', value: overview.totalEnquiries, icon: 'enquiries', path: '/admin/enquiries' },
  ];
  const secondaryMetrics = [
    { label: 'Confirmed bookings', value: overview.confirmedBookings, icon: 'bookings', path: '/admin/bookings' },
    { label: 'Completed bookings', value: overview.completedBookings, icon: 'bookings', path: '/admin/bookings' },
    { label: 'Unread enquiries', value: overview.unreadEnquiries, icon: 'enquiries', path: '/admin/enquiries' },
    { label: 'Customer reviews', value: overview.totalReviews, icon: 'reviews', path: '/admin/reviews' },
    { label: 'Published social posts', value: overview.publishedSocialPosts, icon: 'social', path: '/admin/social/posts' },
    { label: 'Service videos', value: overview.totalServiceVideos, icon: 'videos', path: '/admin/service-videos' },
  ];
  const monthlyTrends = Array.isArray(overview.monthlyTrends) ? overview.monthlyTrends : null;
  const maxMonthlyVal = Math.max(1, ...(monthlyTrends || []).flatMap((month) => [month.bookings, month.enquiries]));
  const sourceStatus = overview.sourceStatus || {};
  const metricValue = (value) => value == null ? 'Not reported' : value;
  const trendPoints = (key) => (monthlyTrends || []).map((month, index) => {
    const x = 20 + (index * 560 / Math.max(1, monthlyTrends.length - 1));
    const y = 130 - (month[key] / maxMonthlyVal) * 110;
    return `${x},${y}`;
  }).join(' ');

  return (
    <>
      <section className="admin-metrics-grid admin-metrics-grid--primary" aria-label="Primary dealership metrics">
        {primaryMetrics.map((metric) => (
          <a className="admin-metric-card" href={metric.path} onClick={(event) => onNavigate(event, metric.path)} key={metric.label}>
            <div className="admin-metric-card__header">
              <span className="admin-metric-card__label">{metric.label}</span>
              <span className="admin-metric-card__icon"><AdminIcon name={metric.icon} size={16} /></span>
            </div>
            <div className="admin-metric-card__val">{metricValue(metric.value)}</div>
          </a>
        ))}
      </section>
      <section className="admin-metrics-grid admin-metrics-grid--secondary" aria-label="Additional dealership metrics">
        {secondaryMetrics.map((metric) => (
          <a className="admin-metric-card" href={metric.path} onClick={(event) => onNavigate(event, metric.path)} key={metric.label}>
            <div className="admin-metric-card__header">
              <span className="admin-metric-card__label">{metric.label}</span>
              <span className="admin-metric-card__icon"><AdminIcon name={metric.icon} size={16} /></span>
            </div>
            <div className="admin-metric-card__val">{metricValue(metric.value)}</div>
          </a>
        ))}
      </section>

      {/* Visual Analytics Charts Grid */}
      <div className="admin-dashboard-panels">
        {/* Booking Status Analytics */}
        <article className="admin-panel" style={{ margin: 0 }}>
          <div className="admin-panel__heading">
            <div>
              <span className="admin-eyebrow">PIPELINE BREAKDOWN</span>
              <h3>Booking & Enquiry Status</h3>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Pending bookings', count: bCounts.pending, color: '#f59e0b', max: Math.max(overview.totalBookings || 1, 1) },
              { label: 'Contacted bookings', count: bCounts.contacted, color: '#0879D1', max: Math.max(overview.totalBookings || 1, 1) },
              { label: 'Confirmed bookings', count: bCounts.confirmed, color: '#10b981', max: Math.max(overview.totalBookings || 1, 1) },
              { label: 'Completed bookings', count: bCounts.completed, color: '#059669', max: Math.max(overview.totalBookings || 1, 1) },
              { label: 'Cancelled bookings', count: bCounts.cancelled, color: '#64748b', max: Math.max(overview.totalBookings || 1, 1) },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                  <span>{item.label}</span>
                  <strong>{metricValue(item.count)}</strong>
                </div>
                <div style={{ height: '7px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${item.count == null ? 0 : Math.min(100, (item.count / item.max) * 100)}%`, height: '100%', background: item.color, borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Monthly Enquiry & Booking Trends Chart */}
        <article className="admin-panel" style={{ margin: 0 }}>
          <div className="admin-panel__heading">
            <div>
              <span className="admin-eyebrow">MONTHLY PERFORMANCE</span>
              <h3>Enquiry & Booking Distribution</h3>
            </div>
          </div>
          {monthlyTrends ? (
            <>
              <svg className="admin-trend-chart" viewBox="0 0 600 155" preserveAspectRatio="none" role="img" aria-label={`Monthly bookings and enquiries: ${monthlyTrends.map((item) => `${item.month}: ${item.bookings} bookings, ${item.enquiries} enquiries`).join('; ')}`}>
                <polyline points={trendPoints('bookings')} fill="none" stroke="#0879D1" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                <polyline points={trendPoints('enquiries')} fill="none" stroke="#6366f1" strokeWidth="3" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="admin-trend-chart__labels" aria-hidden="true">
                {monthlyTrends.map((item) => <span key={item.key || item.month} title={item.month}>{item.month.split(' ')[0]}</span>)}
              </div>
              <table className="sr-only">
                <caption>Monthly booking and enquiry trend data</caption>
                <thead><tr><th>Month</th><th>Bookings</th><th>Enquiries</th></tr></thead>
                <tbody>{monthlyTrends.map((item) => <tr key={item.key || item.month}><td>{item.month}</td><td>{item.bookings}</td><td>{item.enquiries}</td></tr>)}</tbody>
              </table>
            </>
          ) : <p className="admin-panel__footnote">Trend data unavailable.</p>}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px', fontSize: '12px', color: '#64748b' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <i style={{ width: 10, height: 10, background: '#0879D1', borderRadius: 2, display: 'inline-block' }} /> Bookings
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <i style={{ width: 10, height: 10, background: '#6366f1', borderRadius: 2, display: 'inline-block' }} /> Enquiries
            </span>
          </div>
        </article>
      </div>

      <article className="admin-panel admin-overview-system-status">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">SYSTEM STATUS</span><h3>API and storage</h3></div>
        </div>
        <ul className="admin-status-list">
          <li><span>Admin API</span><strong>{overview.apiAvailable ? 'Available' : 'Status unavailable'}</strong></li>
          <li><span>Storage mode</span><strong>{overview.database?.mode === 'mongodb' && overview.database.connected ? 'MongoDB' : overview.database?.mode === 'json-fallback' ? 'Local JSON fallback' : 'Status unavailable'}</strong></li>
          <li><span>Media storage</span><strong>Status unavailable</strong></li>
        </ul>
      </article>

      {/* Quick Action Shortcuts */}
      <article className="admin-panel">
        <div className="admin-panel__heading">
          <div>
            <span className="admin-eyebrow">NAVIGATION SHORTCUTS</span>
            <h3>Quick Operations Hub</h3>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            { label: 'Motorcycles Inventory', path: '/admin/motorcycles', icon: 'motorcycles' },
            { label: 'Customer Bookings', path: '/admin/bookings', icon: 'bookings' },
            { label: 'Customer Enquiries', path: '/admin/enquiries', icon: 'enquiries' },
            { label: 'Service Videos Guides', path: '/admin/service-videos', icon: 'videos' },
            { label: 'Homepage Hero Slides', path: '/admin/home-page', icon: 'home' },
            { label: 'Dealership Settings', path: '/admin/settings', icon: 'settings' },
          ].map((item) => (
            <a
              key={item.path}
              href={item.path}
              onClick={(event) => onNavigate(event, item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '6px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                color: '#172033',
                textDecoration: 'none',
                fontWeight: '650',
                fontSize: '13px',
                transition: 'all 140ms ease',
              }}
            >
              <div style={{ width: 30, height: 30, borderRadius: '4px', background: '#EFF6FF', color: '#0879D1', display: 'grid', placeItems: 'center' }}>
                <AdminIcon name={item.icon} size={15} />
              </div>
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </article>

      {/* Tables Row: Recent Bookings & Recent Enquiries */}
      <div className="admin-dashboard-panels">
        {/* Recent Bookings */}
        <article className="admin-panel" style={{ margin: 0 }}>
          <div className="admin-panel__heading">
            <div>
              <span className="admin-eyebrow">LATEST</span>
              <h3>Recent Customer Bookings</h3>
            </div>
            <a href="/admin/bookings" onClick={(event) => onNavigate(event, '/admin/bookings')} className="admin-panel__hint">View all bookings ↗</a>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Model</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(overview.recentBookings || []).slice(0, 5).map((b) => (
                  <tr key={b.reference || b.id}>
                    <td><strong>{b.customer?.name || b.name || 'Customer name unavailable'}</strong></td>
                    <td>{b.model || b.motorcycleId || 'Not provided'}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${b.status || 'pending'}`}>
                        {b.status || 'Status unavailable'}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!overview.recentBookings || overview.recentBookings.length === 0) && (
                  <tr><td colSpan="3" className="admin-table__empty">{sourceStatus.bookings === 'unavailable' ? 'Bookings unavailable.' : 'No recent bookings yet.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        {/* Recent Enquiries */}
        <article className="admin-panel" style={{ margin: 0 }}>
          <div className="admin-panel__heading">
            <div>
              <span className="admin-eyebrow">LATEST LEADS</span>
              <h3>Customer Enquiries</h3>
            </div>
            <a href="/admin/enquiries" onClick={(event) => onNavigate(event, '/admin/enquiries')} className="admin-panel__hint">View enquiries ↗</a>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Motorcycle</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(overview.recentEnquiries || []).slice(0, 5).map((e) => (
                  <tr key={e.reference || e.id}>
                    <td><strong>{e.customer?.name || e.name || 'Customer name unavailable'}</strong></td>
                    <td>{e.model || e.motorcycleId || 'Not provided'}</td>
                    <td>
                      <span className={`admin-badge ${e.status ? `admin-badge--${e.status}` : ''}`}>
                        {e.status || 'Status unavailable'}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!overview.recentEnquiries || overview.recentEnquiries.length === 0) && (
                  <tr><td colSpan="3" className="admin-table__empty">{sourceStatus.enquiries === 'unavailable' ? 'Enquiries unavailable.' : 'No recent enquiries yet.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      {/* Recent Admin Activities */}
      <article className="admin-panel">
        <div className="admin-panel__heading">
          <div>
            <span className="admin-eyebrow">AUDIT TRAIL</span>
            <h3>Recent System Activities</h3>
          </div>
          <a href="/admin/activity" onClick={(event) => onNavigate(event, '/admin/activity')} className="admin-panel__hint">Full activity logs ↗</a>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {(overview.recentActivity || []).slice(0, 6).map((act) => (
                <tr key={act.id}>
                  <td><small>{act.timestamp ? new Date(act.timestamp).toLocaleTimeString() : 'Recent'}</small></td>
                  <td><span className="admin-badge admin-badge--contacted">{act.action}</span></td>
                  <td><code>{act.target}</code></td>
                  <td><small style={{ color: '#748197' }}>{typeof act.details === 'object' ? JSON.stringify(act.details) : act.details}</small></td>
                </tr>
              ))}
              {(!overview.recentActivity || overview.recentActivity.length === 0) && (
                <tr><td colSpan="4" className="admin-table__empty">{sourceStatus.activity === 'unavailable' ? 'Activity unavailable.' : 'No recent admin activity yet.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </>
  );
}

function YamahaAdmin() {
  const [pathname, setPathname] = useState(() => window.location.pathname.replace(/\/+$/, '') || '/admin');
  const [session, setSession] = useState(null);
  const [sessionError, setSessionError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Layout & UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('vathilai_admin_sidebar_collapsed') === 'true';
  });
  const [notifOpen, setNotifOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Page data state
  const [pageData, setPageData] = useState(null);
  const [loadingPage, setLoadingPage] = useState(false);
  const [pageError, setPageError] = useState(null);
  const [overviewUpdatedAt, setOverviewUpdatedAt] = useState(null);

  // Editor states
  const [motorcycleEditor, setMotorcycleEditor] = useState(undefined);
  const [savingMotorcycle, setSavingMotorcycle] = useState(false);
  const [motorcycleMutationError, setMotorcycleMutationError] = useState('');
  const [bookingUpdates, setBookingUpdates] = useState({});

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('vathilai_admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  const pageTitle = pageTitles.get(pathname) ?? 'Website Management';
  const activeNavigation = navigation.find((item) => item.path === pathname);
  const overviewAvailable = Boolean(pageData?.apiAvailable && pageData?.database);
  const connectionLabel = overviewAvailable
    ? pageData.database.mode === 'mongodb' && pageData.database.connected
      ? 'API available · MongoDB'
      : 'API available · JSON fallback'
    : 'Status unavailable';

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `Admin / ${pageTitle} | Vathilai Motors`;
    return () => { document.title = previousTitle; };
  }, [pageTitle]);

  useEffect(() => {
    let active = true;
    requestJson('/api/admin/session')
      .then((result) => { if (active) setSession(result); })
      .catch((error) => { if (active) setSessionError(error); });
    return () => { active = false; };
  }, [reloadKey]);

  useEffect(() => {
    const updatePath = () => setPathname(window.location.pathname.replace(/\/+$/, '') || '/admin');
    window.addEventListener('popstate', updatePath);
    return () => window.removeEventListener('popstate', updatePath);
  }, []);

  useEffect(() => {
    if (!session?.isAdmin) return;

    let active = true;
    let endpoint = null;
    if (pathname === '/admin' || pathname === '/admin/analytics') endpoint = '/api/admin/overview';
    else if (pathname === '/admin/bookings') endpoint = '/api/admin/bookings';
    else if (pathname === '/admin/motorcycles') endpoint = '/api/admin/motorcycles';
    else if (pathname === '/admin/service-videos') endpoint = '/api/admin/service-videos';

    if (!endpoint) {
      setPageData(null);
      setPageError(null);
      setLoadingPage(false);
      return;
    }

    setPageData(null);
    setPageError(null);
    setLoadingPage(true);
    requestJson(endpoint)
      .then((result) => {
        if (!active) return;
        setPageData(result);
        if (pathname === '/admin') setOverviewUpdatedAt(new Date());
      })
      .catch((error) => { if (active) setPageError(error); })
      .finally(() => { if (active) setLoadingPage(false); });

    return () => { active = false; };
  }, [pathname, session, reloadKey]);

  const filteredMotorcycles = useMemo(() => {
    if (!pageData?.motorcycles) return [];
    const normalizedQuery = query.trim().toLowerCase();
    return pageData.motorcycles.filter((bike) =>
      `${bike.model} ${bike.category} ${bike.id}`.toLowerCase().includes(normalizedQuery)
    );
  }, [pageData, query]);

  const navigate = (event, path) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.history.pushState({}, '', path);
    setPathname(path);
    setQuery('');
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    if (window.confirm('Log out from Vathilai Motors Admin Panel?')) {
      window.location.href = '/';
    }
  };

  const saveMotorcycle = async (motorcycle) => {
    setSavingMotorcycle(true);
    setMotorcycleMutationError('');
    try {
      const updating = Boolean(motorcycleEditor?.id);
      const endpoint = updating
        ? `/api/admin/motorcycles/${encodeURIComponent(motorcycleEditor.id)}`
        : '/api/admin/motorcycles';
      await requestJson(endpoint, {
        method: updating ? 'PUT' : 'POST',
        body: motorcycle,
      });
      setMotorcycleEditor(undefined);
      setReloadKey((key) => key + 1);
    } catch (error) {
      setMotorcycleMutationError(error.message);
    } finally {
      setSavingMotorcycle(false);
    }
  };

  const deleteMotorcycle = async (motorcycle) => {
    if (!window.confirm(`Permanently delete ${motorcycle.model} from the motorcycle catalog?`)) return;
    setMotorcycleMutationError('');
    try {
      await requestJson(`/api/admin/motorcycles/${encodeURIComponent(motorcycle.id)}`, { method: 'DELETE' });
      setReloadKey((key) => key + 1);
    } catch (error) {
      setMotorcycleMutationError(error.message);
    }
  };

  const updateBookingStatus = async (booking, status, notes) => {
    const reference = booking.reference ?? booking.bookingReference ?? booking.id;
    setBookingUpdates((current) => ({ ...current, [reference]: { saving: true, error: '', success: '' } }));
    try {
      const result = await requestJson(`/api/admin/bookings/${encodeURIComponent(reference)}/status`, {
        method: 'PUT',
        body: { status, notes },
      });
      if (!result.booking) throw new Error('The booking service did not return the updated booking.');
      setPageData((current) => ({
        ...current,
        bookings: (current?.bookings ?? []).map((item) =>
          (item.reference ?? item.bookingReference ?? item.id) === reference ? result.booking : item
        ),
      }));
      setBookingUpdates((current) => ({ ...current, [reference]: { saving: false, error: '', success: 'Saved.' } }));
    } catch (error) {
      setBookingUpdates((current) => ({ ...current, [reference]: { saving: false, error: error.message, success: '' } }));
    }
  };

  const sendBookingWhatsApp = async (booking, options = {}) => {
    const reference = booking.reference ?? booking.bookingReference ?? booking.id;
    setBookingUpdates((current) => ({
      ...current,
      [reference]: { ...(current[reference] || {}), sendingWhatsApp: true, waError: '', waSuccess: '' },
    }));
    try {
      const result = await requestJson(`/api/admin/bookings/${encodeURIComponent(reference)}/whatsapp-send`, {
        method: 'POST',
        body: options,
      });
      if (result.booking) {
        setPageData((current) => ({
          ...current,
          bookings: (current?.bookings ?? []).map((item) =>
            (item.reference ?? item.bookingReference ?? item.id) === reference ? result.booking : item
          ),
        }));
      }
      setBookingUpdates((current) => ({
        ...current,
        [reference]: {
          ...(current[reference] || {}),
          sendingWhatsApp: false,
          waError: '',
          waSuccess: result.message || 'WhatsApp message accepted by provider.',
        },
      }));
      return result;
    } catch (error) {
      setBookingUpdates((current) => ({
        ...current,
        [reference]: {
          ...(current[reference] || {}),
          sendingWhatsApp: false,
          waError: error.message || 'Failed to dispatch WhatsApp message.',
          waSuccess: '',
        },
      }));
      throw error;
    }
  };

  const deleteBooking = async (reference) => {
    if (!window.confirm(`Delete booking ${reference} from the database?`)) return;
    try {
      await requestJson(`/api/admin/bookings/${encodeURIComponent(reference)}`, { method: 'DELETE' });
      setReloadKey((key) => key + 1);
    } catch (error) {
      alert(`Failed to delete booking: ${error.message}`);
    }
  };

  if (sessionError) {
    return (
      <main className="yamaha-admin">
        <AdminError message={sessionError.message} onRetry={() => setReloadKey((k) => k + 1)} />
      </main>
    );
  }

  if (!session) return <main className="yamaha-admin"><AdminLoading /></main>;

  const currentGroup = activeNavigation?.group ?? 'Configuration';
  const groups = [...new Set(navigation.map((item) => item.group))];

  return (
    <main className="yamaha-admin">
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 1. Fixed Sidebar with Collapse & Expand */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'is-open' : ''} ${sidebarCollapsed ? 'is-collapsed' : ''}`}>
        <a className="admin-brand" href="/" aria-label="Return to Yamaha website">
          <div className="admin-brand__logo">
            <img src="/imgs/favicon.png" alt="Vathilai Motors Logo" className="admin-brand__logo-img" />
          </div>
          <div className="admin-brand__text">
            <span className="admin-brand__title">VATHILAI MOTORS</span>
            <span className="admin-brand__badge">DEALERSHIP ADMIN</span>
          </div>
        </a>

        <nav className="admin-nav" aria-label="Admin navigation">
          {groups.map((group) => (
            <div className="admin-nav-group" key={group}>
              <span className="admin-nav-group__label">{group}</span>
              {navigation.filter((item) => item.group === group).map((item) => (
                <a
                  className={`admin-nav-link ${pathname === item.path ? 'is-active' : ''}`}
                  href={item.path}
                  key={item.path}
                  title={sidebarCollapsed ? item.label : undefined}
                  aria-current={pathname === item.path ? 'page' : undefined}
                  onClick={(event) => navigate(event, item.path)}
                >
                  <span className="admin-nav-link__icon" aria-hidden="true">
                    <AdminIcon name={item.icon} size={16} />
                  </span>
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar__bottom">
          <div className={`admin-sidebar__db-pill ${overviewAvailable ? 'is-available' : 'is-unavailable'}`}>
            <span className="admin-sidebar__db-dot" />
            <span>{connectionLabel}</span>
          </div>
          <button
            type="button"
            className="admin-sidebar__collapse-btn"
            onClick={toggleSidebarCollapse}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span>{sidebarCollapsed ? '→' : '← Collapse Sidebar'}</span>
          </button>
          <a href="/" className="admin-back-link">
            ← Return to Showroom
          </a>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <section className={`admin-main ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
        {/* Consistent Top Navigation Bar */}
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <button
              type="button"
              className="admin-menu-toggle"
              aria-label="Toggle navigation menu"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <AdminIcon name="menu" size={20} />
            </button>
            <div className="admin-breadcrumb">
              <a href="/admin" onClick={(e) => navigate(e, '/admin')}>Admin</a>
              <i>/</i>
              <span>{currentGroup}</span>
              <i>/</i>
              <strong>{pageTitle}</strong>
            </div>
          </div>

          <div className="admin-topbar__search">
            <AdminIcon name="search" size={15} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search admin records, inventory, leads..."
            />
          </div>

          <div className="admin-topbar__right">
            <div className={`admin-status-pill ${overviewAvailable ? 'is-available' : 'is-unavailable'}`} title={connectionLabel}>
              <span className="admin-status-dot" />
              <span>{connectionLabel}</span>
            </div>

            <a href="/admin/activity" className="admin-button admin-button--secondary admin-button--sm" onClick={(event) => navigate(event, '/admin/activity')}>
              <AdminIcon name="activity" size={15} />
              <span>Activity</span>
            </a>

            {/* User Profile */}
            <div className="admin-user-btn" onClick={(e) => navigate(e, '/admin/profile')} title="View profile settings">
              <div className="admin-user-avatar">
                {session.user?.name ? session.user.name.slice(0, 1).toUpperCase() : 'A'}
              </div>
              <div className="admin-user-meta">
                <span className="admin-user-name">{session.user?.name ?? 'Admin'}</span>
                <span className="admin-user-role">Super Administrator</span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              className="admin-btn-logout"
              onClick={handleLogout}
              title="Sign out of admin"
              aria-label="Log out"
            >
              <AdminIcon name="logout" size={14} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* 3. Page Content Container */}
        <div className="admin-page">
          {loadingPage && <AdminLoading overview={pathname === '/admin'} />}
          {pageError && <AdminError message="Could not load data from the admin API. Retry the request." onRetry={() => setReloadKey((k) => k + 1)} />}

          {/* Module 1: Dashboard Overview */}
          {!loadingPage && !pageError && pathname === '/admin' && (
            <>
              <SectionIntro
                eyebrow="OPERATIONS & PERFORMANCE"
                title="Dealership Dashboard"
                description="Live overview values confirmed by the protected admin API."
                action={
                  <div className="admin-overview-actions">
                    <button
                      type="button"
                      className="admin-button admin-button--secondary admin-button--sm"
                      onClick={() => setReloadKey((k) => k + 1)}
                      disabled={loadingPage}
                    >
                      <AdminIcon name="refresh" size={13} />
                      <span>{loadingPage ? 'Refreshing…' : 'Refresh overview'}</span>
                    </button>
                    {[
                      ['Motorcycles', '/admin/motorcycles'],
                      ['Bookings', '/admin/bookings'],
                      ['Enquiries', '/admin/enquiries'],
                    ].map(([label, path]) => (
                      <a key={path} href={path} onClick={(event) => navigate(event, path)} className="admin-button admin-button--primary admin-button--sm">{label}</a>
                    ))}
                  </div>
                }
              />
              {overviewUpdatedAt && <p className="admin-overview-updated" role="status">Last updated {overviewUpdatedAt.toLocaleTimeString()}</p>}
              <AdminDashboard overview={pageData || {}} onNavigate={(event, path) => navigate(event, path)} />
            </>
          )}

          {/* Module 2: Bookings Management */}
          {!loadingPage && !pageError && pathname === '/admin/bookings' && (
            <>
              <SectionIntro
                eyebrow="SALES & SERVICE OPERATIONS"
                title="Customer Bookings"
                description="Review and manage customer test ride bookings, quotation requests, and service schedules."
                action={
                  <button
                    type="button"
                    className="admin-button admin-button--primary admin-button--sm"
                    onClick={() => downloadCsv(
                      'vathilai-yamaha-bookings.csv',
                      pageData?.bookings ?? [],
                      [
                        { label: 'Reference', key: 'reference' },
                        { label: 'Customer', getter: (b) => b.customer?.name || b.name },
                        { label: 'Phone', getter: (b) => b.customer?.phone || b.phone },
                        { label: 'Motorcycle', getter: (b) => b.model || b.motorcycleId },
                        { label: 'Type', key: 'type' },
                        { label: 'WhatsApp Status', getter: (b) => String(b.whatsappStatus || (b.whatsappMessageId ? 'SENT' : 'NOT_SENT')).toUpperCase() },
                        { label: 'Status', key: 'status' },
                        { label: 'Date', key: 'createdAt' },
                      ]
                    )}
                    disabled={!pageData?.bookings?.length}
                  >
                    <span>Export Bookings CSV</span>
                  </button>
                }
              />
              <BookingsManagement
                bookings={pageData?.bookings ?? []}
                onUpdateStatus={updateBookingStatus}
                onDelete={deleteBooking}
                onSendWhatsApp={sendBookingWhatsApp}
                updates={bookingUpdates}
              />
            </>
          )}

          {/* Module 3: Motorcycles Inventory */}
          {!loadingPage && !pageError && pathname === '/admin/motorcycles' && (
            <>
              <SectionIntro
                eyebrow="INVENTORY & CATALOG"
                title="Motorcycle Fleet Catalog"
                description="Manage models, pricing, specifications, categories, and media for all showroom motorcycles."
                action={
                  <button type="button" className="admin-button admin-button--primary" onClick={() => setMotorcycleEditor({})}>
                    <AdminIcon name="plus" size={15} />
                    <span>Add New Motorcycle</span>
                  </button>
                }
              />
              {motorcycleMutationError && (
                <div className="admin-toast admin-toast--error">
                  <span>{motorcycleMutationError}</span>
                </div>
              )}
              <MotorcyclesManagement
                motorcycles={filteredMotorcycles}
                query={query}
                onEdit={(bike) => setMotorcycleEditor(bike)}
                onDelete={deleteMotorcycle}
              />
              {motorcycleEditor !== undefined && (
                <MotorcycleEditor
                  motorcycle={motorcycleEditor.id ? motorcycleEditor : null}
                  onClose={() => setMotorcycleEditor(undefined)}
                  onSave={saveMotorcycle}
                  saving={savingMotorcycle}
                  error={motorcycleMutationError}
                />
              )}
            </>
          )}

          {/* Module 4: Service Videos Management */}
          {!loadingPage && !pageError && pathname === '/admin/service-videos' && (
            <ServiceVideosManagement
              videos={pageData?.videos ?? []}
              onReload={() => setReloadKey((k) => k + 1)}
            />
          )}

          {/* Module 5: Social Media */}
          {!loadingPage && pathname === '/admin/social' && (
            <SocialMediaDashboard onNavigate={(e) => navigate(e, e.currentTarget.getAttribute('href'))} />
          )}

          {/* Module 6: Social Posts */}
          {!loadingPage && pathname === '/admin/social/posts' && (
            <SocialPosts />
          )}

          {/* Module 7: Contact & Enquiries */}
          {!loadingPage && pathname === '/admin/enquiries' && (
            <ContactEnquiries onNavigate={(e) => navigate(e, e.currentTarget.getAttribute('href'))} />
          )}

          {/* Module 8: Customer Reviews */}
          {!loadingPage && pathname === '/admin/reviews' && (
            <CustomerReviews />
          )}

          {/* Module 9: Gallery Management */}
          {!loadingPage && pathname === '/admin/gallery' && (
            <GalleryManagement />
          )}

          {/* Module 10: Website Content */}
          {!loadingPage && pathname === '/admin/content' && (
            <WebsiteContent />
          )}

          {/* Module 11: Home Page Editor */}
          {!loadingPage && pathname === '/admin/home-page' && (
            <HomePageEditor />
          )}

          {/* Module 12: Website Sections */}
          {!loadingPage && pathname === '/admin/sections' && (
            <WebsiteSections />
          )}

          {/* Module 13: Media Library */}
          {!loadingPage && pathname === '/admin/media' && (
            <MediaLibrary />
          )}

          {/* Module 14: Analytics */}
          {!loadingPage && !pageError && pathname === '/admin/analytics' && (
            <AdminAnalytics overview={pageData || {}} />
          )}

          {/* Module 15: Admin Profile & Settings */}
          {!loadingPage && pathname === '/admin/profile' && (
            <AdminProfileSettings user={session.user} developmentAccess={session.developmentAccess} />
          )}

          {/* Module 16: SEO Settings */}
          {!loadingPage && pathname === '/admin/seo' && (
            <SeoSettings />
          )}

          {/* Module 17: Users & Roles */}
          {!loadingPage && pathname === '/admin/users' && (
            <UsersManagement currentUser={session.user} />
          )}

          {/* Module 18: Activity Logs */}
          {!loadingPage && pathname === '/admin/activity' && (
            <ActivityLogs />
          )}

          {/* Module 19: Dealership Site Settings */}
          {!loadingPage && pathname === '/admin/settings' && (
            <SiteSettings />
          )}
        </div>
      </section>
    </main>
  );
}

export default YamahaAdmin;
