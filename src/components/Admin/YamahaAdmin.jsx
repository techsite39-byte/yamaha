import { useEffect, useMemo, useState } from 'react';
import './YamahaAdmin.css';
import {
  AdminAnalytics,
  AdminProfileSettings,
  ContactEnquiries,
  CustomerReviews,
  GalleryManagement,
  SocialMediaDashboard,
  SocialPlatformSummary,
  SocialPosts,
  WebsiteContent,
} from './YamahaAdminSections.jsx';
import AdminDemoMode from './YamahaAdminDemo.jsx';
import { DEMO_MODE_ENABLED } from './adminDemoProvider.js';
import { navigation, pageTitles } from './adminNavigation.js';

async function requestJson(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
    credentials: 'same-origin',
  });
  const result = response.status === 204 ? {} : await response.json();
  if (!response.ok) {
    const error = new Error(result.message ?? result.code ?? `Request failed (${response.status}).`);
    error.status = response.status;
    error.code = result.code;
    throw error;
  }
  return result;
}

function YamahaMark() {
  return (
    <svg viewBox="0 0 42 42" aria-hidden="true">
      <circle cx="21" cy="21" r="18" />
      <path d="M11 9.5 21 25l10-15.5v13c0 6-4.3 10-10 10s-10-4-10-10zM21 25V7" />
      <path d="M8 16h26" />
    </svg>
  );
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function AdminLoading() {
  return <div className="admin-state" role="status">CONNECTING TO ADMIN SERVICES…</div>;
}

function AdminError({ message, onRetry }) {
  return (
    <div className="admin-state admin-state--error" role="alert">
      <strong>ADMIN SERVICE UNAVAILABLE</strong>
      <span>{message}</span>
      <button className="admin-button" type="button" onClick={onRetry}>RETRY</button>
    </div>
  );
}

const catalogueCategories = ['Sport Bikes', 'Street Bikes', 'Naked Bikes', 'Hybrid Bikes'];
const bookingStatuses = ['new', 'contacted', 'confirmed', 'cancelled'];

function createCatalogueDraft(catalogue = {}) {
  return {
    category: catalogue.category ?? 'Sport Bikes',
    market: catalogue.market ?? 'IN',
    published: Boolean(catalogue.published),
    available: catalogue.available !== false,
    variants: Array.isArray(catalogue.variants) ? [...catalogue.variants] : [],
    colors: Array.isArray(catalogue.colors) ? [...catalogue.colors] : [],
    specifications: Array.isArray(catalogue.specifications)
      ? catalogue.specifications.map((row) => ({ section: row.section ?? '', label: row.label ?? '', value: row.value ?? '' }))
      : [],
    prices: Array.isArray(catalogue.prices)
      ? catalogue.prices.map((row) => ({
        variant: row.variant ?? '',
        city: row.city ?? '',
        exShowroom: row.exShowroom ?? null,
        onRoad: row.onRoad ?? null,
        source: row.source ?? '',
        sourceUrl: row.sourceUrl ?? '',
        checkedAt: row.checkedAt ?? '',
        estimated: Boolean(row.estimated),
      }))
      : [],
    gallery: Array.isArray(catalogue.gallery) ? [...catalogue.gallery] : [],
    officialSourceUrl: catalogue.officialSourceUrl ?? '',
    priceNote: catalogue.priceNote ?? '',
  };
}

function MotorcycleEditor({ motorcycle, onClose, onSave, saving, error }) {
  const [draft, setDraft] = useState(() => ({
    model: motorcycle?.model ?? '',
    category: motorcycle?.category ?? '',
    description: motorcycle?.description ?? '',
    cta: motorcycle?.cta ?? '',
    image: motorcycle?.image ?? '',
    catalogue: createCatalogueDraft(motorcycle?.catalogue),
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
    draft.catalogue[key].map((item, itemIndex) => itemIndex === index ? value : item),
  );
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
    if (!motorcycle?.id) {
      setUploadError('Save this motorcycle first, then reopen it to upload images.');
      event.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const response = await fetch(`/api/admin/motorcycles/${encodeURIComponent(motorcycle.id)}/images`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': file.type },
        body: file,
        cache: 'no-store',
        credentials: 'same-origin',
      });
      const result = response.status === 204 ? {} : await response.json();
      if (!response.ok) throw new Error(result.message ?? result.code ?? `Image upload failed (${response.status}).`);
      if (typeof result.imagePath !== 'string' || !result.imagePath) throw new Error('The image service did not return an image path.');
      if (uploadTarget === 'main') {
        setDraft((current) => ({ ...current, image: result.imagePath }));
      } else {
        setCatalogueValue('gallery', [...draft.catalogue.gallery, result.imagePath]);
      }
      setUploadMessage(`${file.name} uploaded. Save the motorcycle to apply the image path.`);
    } catch (uploadFailure) {
      setUploadError(uploadFailure.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="admin-demo-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="admin-demo-modal" role="dialog" aria-modal="true" aria-labelledby="admin-motorcycle-form-title">
        <div className="admin-panel__heading">
          <div><span className="admin-eyebrow">PUBLIC MOTORCYCLE CATALOG</span><h3 id="admin-motorcycle-form-title">{motorcycle ? 'Edit motorcycle' : 'Add motorcycle'}</h3></div>
          <button type="button" className="admin-icon-button" onClick={onClose} aria-label="Close form">×</button>
        </div>
        <p className="admin-panel__footnote">Changes are saved through the motorcycle API. Uploaded images require an existing motorcycle record; new records can be saved and reopened for upload.</p>
        <form className="admin-demo-form" onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
          <label className="admin-demo-field">
            <span>Model <i aria-hidden="true">*</i></span>
            <input required maxLength="80" value={draft.model} onChange={(event) => setDraft((current) => ({ ...current, model: event.target.value }))} />
          </label>
          <label className="admin-demo-field">
            <span>Existing website category <i aria-hidden="true">*</i></span>
            <input required maxLength="100" value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} />
          </label>
          <label className="admin-demo-field admin-demo-field--wide">
            <span>Catalogue category <i aria-hidden="true">*</i></span>
            <select required value={draft.catalogue.category} onChange={(event) => setCatalogueValue('category', event.target.value)}>
              {catalogueCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label className="admin-demo-field admin-demo-field--wide">
            <span>Main image path <i aria-hidden="true">*</i></span>
            <input required maxLength="500" value={draft.image} onChange={(event) => setDraft((current) => ({ ...current, image: event.target.value }))} />
          </label>
          <label className="admin-demo-field">
            <span>Call-to-action <i aria-hidden="true">*</i></span>
            <input required maxLength="120" value={draft.cta} onChange={(event) => setDraft((current) => ({ ...current, cta: event.target.value }))} />
          </label>
          <label className="admin-demo-field admin-demo-field--wide">
            <span>Description <i aria-hidden="true">*</i></span>
            <textarea required maxLength="2000" rows="4" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
          </label>
          <div className="admin-catalogue-section admin-demo-field--wide">
            <span className="admin-eyebrow">CATALOGUE VISIBILITY</span>
            <div className="admin-catalogue-toggles">
              <label><input type="checkbox" checked={draft.catalogue.published} onChange={(event) => setCatalogueValue('published', event.target.checked)} /> Published</label>
              <label><input type="checkbox" checked={draft.catalogue.available} onChange={(event) => setCatalogueValue('available', event.target.checked)} /> Available</label>
            </div>
          </div>
          <label className="admin-demo-field">
            <span>Market</span>
            <input maxLength="10" value={draft.catalogue.market} onChange={(event) => setCatalogueValue('market', event.target.value)} />
          </label>
          <label className="admin-demo-field">
            <span>Official source URL</span>
            <input type="url" value={draft.catalogue.officialSourceUrl} onChange={(event) => setCatalogueValue('officialSourceUrl', event.target.value)} />
          </label>
          <label className="admin-demo-field admin-demo-field--wide">
            <span>Price and availability note</span>
            <textarea maxLength="1000" rows="3" value={draft.catalogue.priceNote} onChange={(event) => setCatalogueValue('priceNote', event.target.value)} />
          </label>
          {['variants', 'colors'].map((key) => (
            <div className="admin-catalogue-section admin-demo-field--wide" key={key}>
              <div className="admin-catalogue-section__heading">
                <span className="admin-eyebrow">{key === 'variants' ? 'VARIANTS' : 'COLORS'}</span>
                <button type="button" className="admin-text-button" onClick={() => setCatalogueValue(key, [...draft.catalogue[key], ''])}>ADD {key === 'variants' ? 'VARIANT' : 'COLOR'}</button>
              </div>
              {draft.catalogue[key].map((value, index) => (
                <div className="admin-catalogue-row" key={`${key}-${index}`}>
                  <input aria-label={`${key} ${index + 1}`} value={value} onChange={(event) => updateList(key, index, event.target.value)} />
                  <button type="button" className="admin-text-button admin-text-button--danger" onClick={() => setCatalogueValue(key, draft.catalogue[key].filter((_, itemIndex) => itemIndex !== index))}>REMOVE</button>
                </div>
              ))}
            </div>
          ))}
          <div className="admin-catalogue-section admin-demo-field--wide">
            <div className="admin-catalogue-section__heading">
              <span className="admin-eyebrow">VERIFIED SPECIFICATIONS</span>
              <button type="button" className="admin-text-button" onClick={() => setCatalogueValue('specifications', [...draft.catalogue.specifications, { section: '', label: '', value: '' }])}>ADD SPEC</button>
            </div>
            {draft.catalogue.specifications.map((spec, index) => (
              <div className="admin-catalogue-row admin-catalogue-row--spec" key={`spec-${index}`}>
                {['section', 'label', 'value'].map((key) => (
                  <input key={key} aria-label={`Specification ${index + 1} ${key}`} placeholder={key} value={spec[key]} onChange={(event) => {
                    const specifications = draft.catalogue.specifications.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: event.target.value } : row);
                    setCatalogueValue('specifications', specifications);
                  }} />
                ))}
                <button type="button" className="admin-text-button admin-text-button--danger" onClick={() => setCatalogueValue('specifications', draft.catalogue.specifications.filter((_, itemIndex) => itemIndex !== index))}>REMOVE</button>
              </div>
            ))}
          </div>
          <div className="admin-catalogue-section admin-demo-field--wide">
            <div className="admin-catalogue-section__heading">
              <span className="admin-eyebrow">CITY PRICE ROWS</span>
              <button type="button" className="admin-text-button" onClick={() => setCatalogueValue('prices', [...draft.catalogue.prices, { variant: '', city: '', exShowroom: null, onRoad: null, source: '', sourceUrl: '', checkedAt: '', estimated: false }])}>ADD PRICE</button>
            </div>
            {draft.catalogue.prices.map((price, index) => (
              <div className="admin-catalogue-price" key={`price-${index}`}>
                {['variant', 'city', 'exShowroom', 'onRoad', 'source', 'sourceUrl', 'checkedAt'].map((key) => (
                  <label className="admin-demo-field" key={key}>
                    <span>{key === 'exShowroom' ? 'Ex-showroom' : key === 'onRoad' ? 'On-road' : key === 'checkedAt' ? 'Checked date' : key}</span>
                    <input
                      type={['exShowroom', 'onRoad'].includes(key) ? 'number' : key === 'checkedAt' ? 'date' : key === 'sourceUrl' ? 'url' : 'text'}
                      min={['exShowroom', 'onRoad'].includes(key) ? '0' : undefined}
                      step={['exShowroom', 'onRoad'].includes(key) ? '1' : undefined}
                      value={key === 'checkedAt' && price[key] ? String(price[key]).slice(0, 10) : price[key] ?? ''}
                      onChange={(event) => {
                        const value = ['exShowroom', 'onRoad'].includes(key)
                          ? (event.target.value === '' ? null : Number(event.target.value))
                          : event.target.value;
                        const prices = draft.catalogue.prices.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row);
                        setCatalogueValue('prices', prices);
                      }}
                    />
                  </label>
                ))}
                <label className="admin-catalogue-check"><input type="checkbox" checked={price.estimated} onChange={(event) => {
                  const prices = draft.catalogue.prices.map((row, rowIndex) => rowIndex === index ? { ...row, estimated: event.target.checked } : row);
                  setCatalogueValue('prices', prices);
                }} /> Estimated</label>
                <button type="button" className="admin-text-button admin-text-button--danger" onClick={() => setCatalogueValue('prices', draft.catalogue.prices.filter((_, itemIndex) => itemIndex !== index))}>REMOVE PRICE</button>
              </div>
            ))}
          </div>
          <div className="admin-catalogue-section admin-demo-field--wide">
            <div className="admin-catalogue-section__heading">
              <span className="admin-eyebrow">GALLERY IMAGE PATHS</span>
              <button type="button" className="admin-text-button" onClick={() => setCatalogueValue('gallery', [...draft.catalogue.gallery, ''])}>ADD PATH</button>
            </div>
            {draft.catalogue.gallery.map((imagePath, index) => (
              <div className="admin-catalogue-row" key={`gallery-${index}`}>
                <input aria-label={`Gallery image path ${index + 1}`} value={imagePath} onChange={(event) => updateList('gallery', index, event.target.value)} />
                <button type="button" className="admin-text-button admin-text-button--danger" onClick={() => setCatalogueValue('gallery', draft.catalogue.gallery.filter((_, itemIndex) => itemIndex !== index))}>REMOVE</button>
              </div>
            ))}
          </div>
          <div className="admin-catalogue-section admin-demo-field--wide">
            <span className="admin-eyebrow">UPLOAD IMAGE</span>
            <div className="admin-catalogue-upload">
              <select aria-label="Image upload destination" value={uploadTarget} onChange={(event) => setUploadTarget(event.target.value)}>
                <option value="main">Set as main image</option>
                <option value="gallery">Append to gallery</option>
              </select>
              <input aria-label="Choose image to upload" type="file" accept="image/webp,image/jpeg,image/png" onChange={uploadImage} disabled={uploading || !motorcycle?.id} />
            </div>
            {!motorcycle?.id && <small className="admin-catalogue-help">Save and reopen a new motorcycle before uploading its images.</small>}
            {uploading && <p className="admin-catalogue-help" role="status">Uploading image…</p>}
            {uploadError && <p className="admin-demo-form-error" role="alert">{uploadError}</p>}
            {uploadMessage && <p className="admin-catalogue-success" role="status">{uploadMessage}</p>}
          </div>
          {error && <p className="admin-demo-form-error" role="alert">{error}</p>}
          <div className="admin-demo-form__actions">
            <button type="button" className="admin-button" onClick={onClose}>CANCEL</button>
            <button type="submit" className="admin-button admin-button--primary" disabled={saving || uploading}>{saving ? 'SAVING…' : 'SAVE MOTORCYCLE'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function bookingValue(booking, keys, fallback = '—') {
  for (const key of keys) {
    const value = key.split('.').reduce((current, part) => current?.[part], booking);
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
}

function bookingPrice(booking) {
  const snapshot = bookingValue(booking, ['priceSnapshot', 'bookingSnapshot.price', 'price', 'priceSnapshot.onRoad']);
  if (typeof snapshot !== 'object' || snapshot === null) return snapshot;
  const parts = [
    snapshot.variant,
    snapshot.city,
    snapshot.exShowroom != null ? `Ex-showroom ₹${Number(snapshot.exShowroom).toLocaleString('en-IN')}` : null,
    snapshot.onRoad != null ? `On-road ₹${Number(snapshot.onRoad).toLocaleString('en-IN')}` : null,
    snapshot.amount != null ? `${snapshot.currency ?? '₹'}${Number(snapshot.amount).toLocaleString('en-IN')}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : JSON.stringify(snapshot);
}

function BookingsManagement({ bookings, onStatusChange, updates }) {
  const [activeDetail, setActiveDetail] = useState(null);

  return (
    <section className="admin-panel admin-table-panel admin-bookings-panel">
      <div className="admin-panel__heading">
        <div><span className="admin-eyebrow">CUSTOMER BOOKINGS & ENQUIRIES</span><h3>Dealership enquiries and requests</h3></div>
        <span className="admin-panel__hint">{bookings.length} records</span>
      </div>
      <p className="admin-panel__footnote">Customer enquiry and booking details are shown from each saved request snapshot.</p>
      <div className="admin-table-scroll">
        <table className="admin-table admin-bookings-table">
          <thead><tr><th>Reference</th><th>Customer</th><th>Motorcycle</th><th>Location</th><th>Date</th><th>Price snapshot</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {bookings.map((booking) => {
              const reference = bookingValue(booking, ['reference', 'bookingReference', 'id']);
              const update = updates[reference] ?? {};
              const customer = bookingValue(booking, ['customer.name', 'customerName', 'name', 'customerDetails.name']);
              const email = bookingValue(booking, ['customer.email', 'email', 'customerDetails.email'], '');
              const phone = bookingValue(booking, ['customer.phone', 'phone', 'mobile', 'customerDetails.phone'], '');
              const bike = bookingValue(booking, ['motorcycle.model', 'bike.model', 'motorcycleModel', 'bikeModel', 'motorcycleName', 'model']);
              const variant = bookingValue(booking, ['variant', 'motorcycle.variant', 'bike.variant', 'selectedVariant'], '');
              const location = bookingValue(booking, ['location', 'city', 'priceSnapshot.city', 'price.city', 'customer.city']);
              const date = bookingValue(booking, ['preferredDate', 'bookingDate', 'date', 'createdAt', 'requestedAt']);
              const status = bookingStatuses.includes(booking.status) ? booking.status : 'new';
              const parsedDate = date === '—' ? null : new Date(date);
              const dateLabel = !parsedDate || Number.isNaN(parsedDate.getTime()) ? date : parsedDate.toLocaleDateString();
              const isEnquiry = booking.type === 'enquiry' || Boolean(booking.enquiry);

              return (
                <tr key={reference}>
                  <td>
                    <code>{reference}</code>
                    <small style={{ display: 'block', color: isEnquiry ? '#0876c9' : '#059669', fontWeight: 600 }}>
                      {isEnquiry ? 'ENQUIRY' : 'BOOKING'}
                    </small>
                  </td>
                  <td><strong>{customer}</strong>{email && <small>{email}</small>}{phone && <small>{phone}</small>}</td>
                  <td><strong>{bike}</strong>{variant && <small>{variant}</small>}</td>
                  <td>{location}</td>
                  <td>{dateLabel}</td>
                  <td>{bookingPrice(booking)}</td>
                  <td>
                    <select className="admin-booking-status" aria-label={`Status for booking ${reference}`} value={status} disabled={update.saving} onChange={(event) => onStatusChange(booking, event.target.value)}>
                      {bookingStatuses.map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
                    </select>
                    {update.saving && <small role="status">Saving…</small>}
                    {update.error && <small className="admin-booking-error" role="alert">{update.error}</small>}
                    {update.success && <small className="admin-booking-success" role="status">{update.success}</small>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="admin-button"
                        style={{ padding: '4px 10px', fontSize: '11px', letterSpacing: '0.04em' }}
                        onClick={() => setActiveDetail(booking)}
                      >
                        DETAILS
                      </button>
                      {status === 'new' && (
                        <button
                          type="button"
                          className="admin-button admin-button--primary"
                          style={{ padding: '4px 10px', fontSize: '11px', letterSpacing: '0.04em' }}
                          disabled={update.saving}
                          onClick={() => onStatusChange(booking, 'contacted')}
                          title="Mark this customer as contacted"
                        >
                          CONTACTED
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {bookings.length === 0 && <tr><td className="admin-table__empty" colSpan="8">No enquiries or bookings found.</td></tr>}
          </tbody>
        </table>
      </div>

      {activeDetail && (
        <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="enquiry-detail-title">
          <div className="admin-modal__card" style={{ maxWidth: 640 }}>
            <div className="admin-modal__heading">
              <div>
                <span className="admin-eyebrow">ENQUIRY RECORD</span>
                <h3 id="enquiry-detail-title">
                  {bookingValue(activeDetail, ['reference', 'id'])} · {bookingValue(activeDetail, ['motorcycle.model', 'model'])}
                </h3>
              </div>
              <button type="button" className="admin-modal__close" onClick={() => setActiveDetail(null)} aria-label="Close dialog">✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', margin: '20px 0' }}>
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <strong style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Customer Information</strong>
                <p style={{ margin: '4px 0' }}><strong>Name:</strong> {bookingValue(activeDetail, ['customer.name', 'name'])}</p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Phone:</strong> <a href={`tel:${bookingValue(activeDetail, ['customer.phone', 'phone'])}`}>{bookingValue(activeDetail, ['customer.phone', 'phone'])}</a>
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Email:</strong> <a href={`mailto:${bookingValue(activeDetail, ['customer.email', 'email'])}`}>{bookingValue(activeDetail, ['customer.email', 'email'])}</a>
                </p>
                <p style={{ margin: '4px 0' }}><strong>City:</strong> {bookingValue(activeDetail, ['customer.city', 'city'])}</p>
                <p style={{ margin: '4px 0' }}><strong>Preferred Contact:</strong> {bookingValue(activeDetail, ['customer.preferredContactMethod', 'preferredContactMethod'], 'Phone Call')}</p>
              </div>

              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <strong style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Motorcycle & Dealership</strong>
                <p style={{ margin: '4px 0' }}><strong>Model:</strong> {bookingValue(activeDetail, ['model', 'motorcycle.model'])}</p>
                <p style={{ margin: '4px 0' }}><strong>Variant:</strong> {bookingValue(activeDetail, ['variant', 'selectedVariant'], 'Standard')}</p>
                <p style={{ margin: '4px 0' }}><strong>Motorcycle ID:</strong> <code>{bookingValue(activeDetail, ['motorcycleId', 'id'])}</code></p>
                <p style={{ margin: '4px 0' }}><strong>Price Snapshot:</strong> {bookingPrice(activeDetail)}</p>
                <p style={{ margin: '4px 0' }}><strong>Dealership:</strong> {bookingValue(activeDetail, ['dealership', 'customer.dealership'])}</p>
              </div>
            </div>

            {bookingValue(activeDetail, ['customer.message', 'message']) && (
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <strong style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Customer Message / Requirements</strong>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#1e293b' }}>{bookingValue(activeDetail, ['customer.message', 'message'])}</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Update Status:</span>
                <select
                  className="admin-booking-status"
                  value={bookingStatuses.includes(activeDetail.status) ? activeDetail.status : 'new'}
                  onChange={(e) => {
                    onStatusChange(activeDetail, e.target.value);
                    setActiveDetail((curr) => curr ? ({ ...curr, status: e.target.value }) : null);
                  }}
                >
                  {bookingStatuses.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                </select>
                {activeDetail.status !== 'contacted' && (
                  <button
                    type="button"
                    className="admin-button admin-button--primary"
                    style={{ padding: '6px 14px' }}
                    onClick={() => {
                      onStatusChange(activeDetail, 'contacted');
                      setActiveDetail((curr) => curr ? ({ ...curr, status: 'contacted' }) : null);
                    }}
                  >
                    MARK AS CONTACTED
                  </button>
                )}
              </div>
              <button type="button" className="admin-button" onClick={() => setActiveDetail(null)}>CLOSE</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function MotorcycleManagement({ motorcycles, onCreate, onEdit, onDelete, error }) {
  return (
    <section className="admin-panel admin-table-panel">
      <div className="admin-panel__heading">
        <div><span className="admin-eyebrow">PUBLIC SOURCE RECORDS</span><h3>Motorcycle catalog</h3></div>
        <button className="admin-button admin-button--primary" type="button" onClick={onCreate}>ADD MOTORCYCLE <span>＋</span></button>
      </div>
      <p className="admin-panel__footnote">Updates are stored in the server catalog. Catalogue metadata, verified specs, city pricing, and image paths are editable here.</p>
      {error && <p className="admin-demo-form-error" role="alert">{error}</p>}
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead><tr><th>Model</th><th>Category</th><th>Model ID</th><th>Features</th><th>Actions</th></tr></thead>
          <tbody>
            {motorcycles.map((motorcycle) => (
              <tr key={motorcycle.id}>
                <td><strong>{motorcycle.model}</strong></td>
                <td>{motorcycle.category}</td>
                <td><code>{motorcycle.id}</code></td>
                <td>{motorcycle.features?.length ?? 0}</td>
                <td>
                  <div className="admin-demo-row-actions">
                    <button className="admin-text-button" type="button" onClick={() => onEdit(motorcycle)}>EDIT</button>
                    <button className="admin-text-button admin-text-button--danger" type="button" onClick={() => onDelete(motorcycle)}>DELETE</button>
                  </div>
                </td>
              </tr>
            ))}
            {motorcycles.length === 0 && <tr><td className="admin-table__empty" colSpan="5">No motorcycles match this search.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdminDashboard({ overview, onNavigate }) {
  const metrics = [
    { label: 'MOTORCYCLES', value: overview.totalMotorcycles, note: 'Server catalog records' },
    { label: 'PUBLIC PAGES', value: overview.websitePages.length, note: 'Routes in the current app' },
    { label: 'SERVICE VIDEOS', value: overview.serviceVideoCount, note: 'Local public files' },
  ];

  return (
    <>
      <section className="admin-welcome">
        <div>
          <span className="admin-eyebrow">YAMAHA / CONTENT OPERATIONS</span>
          <h2>Command <em>center.</em></h2>
          <p>The motorcycle catalog and customer bookings are managed through the server. Enquiries and other publishing modules still need their data services.</p>
        </div>
        <span className="admin-readonly-badge"><i /> READ-ONLY SOURCE DATA</span>
      </section>

      <section className="admin-metrics" aria-label="Website content totals">
        {metrics.map((metric) => (
          <article className="admin-metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.note}</small>
          </article>
        ))}
        <article className="admin-metric admin-metric--status">
          <span>VISITOR ANALYTICS</span>
          <strong>Not connected</strong>
          <small>No traffic tracking configured</small>
        </article>
      </section>

      <section className="admin-grid">
        <article className="admin-panel admin-content-chart">
          <div className="admin-panel__heading">
            <div><span className="admin-eyebrow">INVENTORY</span><h3>Content overview</h3></div>
            <span className="admin-panel__hint">Source records</span>
          </div>
          <div className="admin-bars" role="img" aria-label={`Current source inventory: ${overview.totalMotorcycles} motorcycles, ${overview.serviceVideoCount} service videos, ${overview.websitePages.length} website pages`}>
            {[
              { label: 'Motorcycles', value: overview.totalMotorcycles, color: 'blue' },
              { label: 'Service videos', value: overview.serviceVideoCount, color: 'silver' },
              { label: 'Pages', value: overview.websitePages.length, color: 'muted' },
            ].map((item) => (
              <div className="admin-bar-row" key={item.label}>
                <span>{item.label}</span>
                <div className="admin-bar-track"><i className={`is-${item.color}`} style={{ width: `${Math.max(8, (item.value / Math.max(overview.totalMotorcycles, 1)) * 100)}%` }} /></div>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
          <p className="admin-panel__footnote">Motorcycle counts reflect the server catalog; other counts reflect local source assets and are not visitor metrics.</p>
        </article>

        <article className="admin-panel admin-system-panel">
          <div className="admin-panel__heading">
            <div><span className="admin-eyebrow">CONNECTIONS</span><h3>System status</h3></div>
          </div>
          <ul className="admin-status-list">
            <li><span>Auth0 identity</span><strong className={overview.authConfigured ? 'is-connected' : ''}><i /> {overview.authConfigured ? 'Connected' : 'Development access'}</strong></li>
            <li><span>MongoDB database</span><strong><i /> Not connected</strong></li>
            <li><span>Media object storage</span><strong><i /> Not connected</strong></li>
            <li><span>Website analytics</span><strong><i /> Not connected</strong></li>
          </ul>
        </article>

        <article className="admin-panel admin-activity-panel">
          <div className="admin-panel__heading">
            <div><span className="admin-eyebrow">AUDIT TRAIL</span><h3>Recent activity</h3></div>
            <span className="admin-panel__hint">Database required</span>
          </div>
          <div className="admin-empty">
            <span className="admin-empty__mark" aria-hidden="true">—</span>
            <strong>No persistent activity records</strong>
            <p>Activity history will be available after the database is provisioned.</p>
          </div>
        </article>

        <article className="admin-panel admin-quick-panel">
          <div className="admin-panel__heading">
            <div><span className="admin-eyebrow">QUICK ACCESS</span><h3>Source inventory</h3></div>
          </div>
          <div className="admin-quick-links">
            <a href="/admin/motorcycles" onClick={onNavigate}>Browse motorcycles <span>↗</span></a>
            <a href="/admin/bookings" onClick={onNavigate}>Review customer bookings <span>↗</span></a>
            <a href="/admin/service-videos" onClick={onNavigate}>Inspect service videos <span>↗</span></a>
            <a href="/admin/social" onClick={onNavigate}>Open social media status <span>↗</span></a>
          </div>
          <p className="admin-panel__footnote">Only the motorcycle catalog currently supports edits. Other modules need their own approved storage and API integrations.</p>
        </article>
        <SocialPlatformSummary onNavigate={onNavigate} />
      </section>
    </>
  );
}

function YamahaAdminApi() {
  const [pathname, setPathname] = useState(window.location.pathname.replace(/\/+$/, '') || '/admin');
  const [session, setSession] = useState(null);
  const [sessionError, setSessionError] = useState(null);
  const [pageData, setPageData] = useState(null);
  const [pageError, setPageError] = useState(null);
  const [loadingPage, setLoadingPage] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [motorcycleEditor, setMotorcycleEditor] = useState(undefined);
  const [motorcycleMutationError, setMotorcycleMutationError] = useState('');
  const [savingMotorcycle, setSavingMotorcycle] = useState(false);
  const [bookingUpdates, setBookingUpdates] = useState({});
  const [reloadKey, setReloadKey] = useState(0);
  const pageTitle = pageTitles.get(pathname) ?? 'Website management';
  const activeNavigation = navigation.find((item) => item.path === pathname);
  const loginReturnTo = encodeURIComponent(pathname);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `Admin / ${pageTitle} | Yamaha`;
    return () => { document.title = previousTitle; };
  }, [pageTitle]);

  useEffect(() => {
    let active = true;
    setSession(null);
    setSessionError(null);
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
    const needsOverview = pathname === '/admin' || pathname === '/admin/analytics';
    if (!session?.isAdmin || (!needsOverview && !['/admin/motorcycles', '/admin/service-videos', '/admin/bookings', '/admin/enquiries'].includes(pathname))) {
      setPageData(null);
      setPageError(null);
      setLoadingPage(false);
      return undefined;
    }

    let active = true;
    const endpoint = pathname === '/admin/motorcycles'
      ? '/api/admin/motorcycles'
      : pathname === '/admin/service-videos'
        ? '/api/admin/service-videos'
        : (pathname === '/admin/bookings' || pathname === '/admin/enquiries')
          ? '/api/admin/bookings'
        : '/api/admin/overview';
    setPageData(null);
    setPageError(null);
    setLoadingPage(true);
    requestJson(endpoint)
      .then((result) => { if (active) setPageData(result); })
      .catch((error) => { if (active) setPageError(error); })
      .finally(() => { if (active) setLoadingPage(false); });
    return () => { active = false; };
  }, [pathname, session]);

  const filteredMotorcycles = useMemo(() => {
    if (!pageData?.motorcycles) return [];
    const normalizedQuery = query.trim().toLowerCase();
    return pageData.motorcycles.filter((motorcycle) =>
      `${motorcycle.model} ${motorcycle.category} ${motorcycle.id}`.toLowerCase().includes(normalizedQuery));
  }, [pageData, query]);
  const filteredVideos = useMemo(() => {
    if (!Array.isArray(pageData?.videos)) return [];
    return pageData.videos.filter((video) =>
      video.filename.toLowerCase().includes(query.trim().toLowerCase()));
  }, [pageData, query]);

  const navigate = (event, path) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.history.pushState({}, '', path);
    setPathname(path);
    setQuery('');
    window.scrollTo(0, 0);
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
    if (!window.confirm(`Delete ${motorcycle.model} from the public motorcycle catalog?`)) return;
    setMotorcycleMutationError('');
    try {
      await requestJson(`/api/admin/motorcycles/${encodeURIComponent(motorcycle.id)}`, { method: 'DELETE' });
      setReloadKey((key) => key + 1);
    } catch (error) {
      setMotorcycleMutationError(error.message);
    }
  };
  const createMotorcycle = () => {
    setMotorcycleMutationError('');
    setMotorcycleEditor(null);
  };
  const editMotorcycle = (motorcycle) => {
    setMotorcycleMutationError('');
    setMotorcycleEditor(motorcycle);
  };
  const updateBookingStatus = async (booking, status) => {
    const reference = booking.reference ?? booking.bookingReference ?? booking.id;
    setBookingUpdates((current) => ({ ...current, [reference]: { saving: true, error: '', success: '' } }));
    try {
      const result = await requestJson(`/api/admin/bookings/${encodeURIComponent(reference)}/status`, {
        method: 'PUT',
        body: { status },
      });
      if (!result.booking) throw new Error('The booking service did not return the updated booking.');
      setPageData((current) => ({
        ...current,
        bookings: (current?.bookings ?? []).map((item) =>
          (item.reference ?? item.bookingReference ?? item.id) === reference ? result.booking : item),
      }));
      setBookingUpdates((current) => ({ ...current, [reference]: { saving: false, error: '', success: 'Status saved.' } }));
    } catch (error) {
      setBookingUpdates((current) => ({ ...current, [reference]: { saving: false, error: error.message, success: '' } }));
    }
  };

  if (sessionError?.code === 'auth_not_configured') {
    return (
      <main className="yamaha-admin admin-auth-screen">
        <section className="admin-auth-card">
          <a className="admin-brand" href="/" aria-label="Return to Yamaha website"><YamahaMark /><span>YAMAHA <small>ADMINISTRATION</small></span></a>
          <span className="admin-eyebrow">SECURE MANAGEMENT ACCESS</span>
          <h1>Administrator <em>sign in.</em></h1>
          <p>Auth0 is not configured on this server. Local development access is available only through the development server. Configure Auth0 in <code>server/data/.env</code> before production deployment.</p>
          <span className="admin-readonly-badge"><i /> AUTHENTICATION NOT CONFIGURED</span>
          <a className="admin-back-link" href="/">← Return to Yamaha website</a>
        </section>
      </main>
    );
  }

  if (sessionError) {
    return <main className="yamaha-admin"><AdminError message="The admin API is unreachable through the configured development proxy. Check that the Express API is running and VITE_ADMIN_API_URL targets its origin." onRetry={() => setReloadKey((key) => key + 1)} /></main>;
  }
  if (!session) return <main className="yamaha-admin"><AdminLoading /></main>;
  if (!session.authenticated) {
    return (
      <main className="yamaha-admin admin-auth-screen">
        <section className="admin-auth-card">
          <a className="admin-brand" href="/" aria-label="Return to Yamaha website"><YamahaMark /><span>YAMAHA <small>ADMINISTRATION</small></span></a>
          <span className="admin-eyebrow">SECURE MANAGEMENT ACCESS</span>
          <h1>Welcome <em>back.</em></h1>
          <p>Sign in with an authorized Yamaha administrator account to continue.</p>
          <a className="admin-button admin-button--primary" href={`/login?returnTo=${loginReturnTo}`}>CONTINUE WITH AUTH0 <span>↗</span></a>
          <small className="admin-auth-note">Protected by Auth0. Access is limited to explicitly approved administrator accounts.</small>
        </section>
      </main>
    );
  }
  if (!session.isAdmin) {
    return (
      <main className="yamaha-admin admin-auth-screen">
        <section className="admin-auth-card" role="alert">
          <a className="admin-brand" href="/" aria-label="Return to Yamaha website"><YamahaMark /><span>YAMAHA <small>ADMINISTRATION</small></span></a>
          <span className="admin-eyebrow">ACCESS RESTRICTED</span>
          <h1>Not <em>authorized.</em></h1>
          <p>Your identity is verified, but your Auth0 subject is not on the server-side administrator allowlist.</p>
          <a className="admin-button" href="/logout">SIGN OUT</a>
        </section>
      </main>
    );
  }

  const currentGroup = activeNavigation?.group ?? 'Configuration';
  const groups = [...new Set(navigation.map((item) => item.group))];

  return (
    <main className="yamaha-admin">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/" aria-label="Return to Yamaha website">
          <YamahaMark />
          <span>YAMAHA <small>ADMINISTRATION</small></span>
        </a>
        <div className="admin-side-rule" />
        <nav className="admin-nav" aria-label="Admin navigation">
          {groups.map((group) => (
            <div className="admin-nav-group" key={group}>
              <span className="admin-nav-group__label">{group}</span>
              {navigation.filter((item) => item.group === group).map((item) => (
                <a
                  className={`admin-nav-link${pathname === item.path ? ' is-active' : ''}`}
                  href={item.path}
                  key={item.path}
                  aria-current={pathname === item.path ? 'page' : undefined}
                  onClick={(event) => navigate(event, item.path)}
                >
                  <span className="admin-nav-link__icon" aria-hidden="true">{item.icon.slice(0, 1).toUpperCase()}</span>
                  <span>{item.label}</span>
                  {(item.databaseRequired || item.badge) && (
                    <span
                      className="admin-nav-link__lock"
                      title={item.databaseRequired ? 'Requires database connection' : 'Requires external service setup'}
                    >
                      {item.databaseRequired ? 'DB' : item.badge}
                    </span>
                  )}
                </a>
              ))}
            </div>
          ))}
        </nav>
        <div className="admin-sidebar__bottom">
          <a href="/" className="admin-back-link">← View public website</a>
          <span>{session.developmentAccess ? 'LOCAL DEVELOPMENT SESSION' : 'ADMIN SESSION / AUTH0'}</span>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb"><span>YAMAHA</span><i>/</i><strong>{pageTitle}</strong></div>
          <div className="admin-account">
            <span className="admin-account__status"><i /> {session.developmentAccess ? 'LOCAL DEVELOPMENT ACCESS' : 'SECURE SESSION'}</span>
            <span className="admin-account__name">{session.user?.name ?? 'Administrator'}</span>
            {!session.developmentAccess && <a href="/logout" className="admin-logout">LOG OUT</a>}
          </div>
        </header>

        <div className="admin-page">
          <div className="admin-page-heading">
            <div><span className="admin-eyebrow">{currentGroup.toUpperCase()} / ADMIN</span><h1>{pageTitle}</h1></div>
            {['/admin/motorcycles', '/admin/service-videos'].includes(pathname) && (
              <label className="admin-search">
                <span className="sr-only">Search {pageTitle.toLowerCase()}</span>
                <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4 4" /></svg>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${pageTitle.toLowerCase()}`} />
              </label>
            )}
          </div>

          {loadingPage && <AdminLoading />}
          {pageError && <AdminError message="Could not load this source inventory. Retry the request." onRetry={() => setReloadKey((key) => key + 1)} />}
          {!loadingPage && !pageError && pathname === '/admin' && Array.isArray(pageData?.websitePages) && <AdminDashboard overview={pageData} onNavigate={(event) => navigate(event, event.currentTarget.getAttribute('href'))} />}
          {!loadingPage && !pageError && pathname === '/admin/analytics' && Array.isArray(pageData?.websitePages) && <AdminAnalytics overview={pageData} />}
          {!loadingPage && pathname === '/admin/social' && <SocialMediaDashboard onNavigate={(event) => navigate(event, event.currentTarget.getAttribute('href'))} />}
          {!loadingPage && pathname === '/admin/social/posts' && <SocialPosts selectedPlatform={selectedPlatform} onSelectPlatform={setSelectedPlatform} />}
          {!loadingPage && !pageError && (pathname === '/admin/bookings' || pathname === '/admin/enquiries') && Array.isArray(pageData?.bookings) && (
            <BookingsManagement bookings={pageData.bookings} onStatusChange={updateBookingStatus} updates={bookingUpdates} />
          )}
          {!loadingPage && pathname === '/admin/reviews' && <CustomerReviews />}
          {!loadingPage && pathname === '/admin/gallery' && <GalleryManagement />}
          {!loadingPage && pathname === '/admin/content' && <WebsiteContent />}
          {!loadingPage && pathname === '/admin/profile' && <AdminProfileSettings user={session.user} developmentAccess={session.developmentAccess} />}
          {!loadingPage && !pageError && pathname === '/admin/motorcycles' && Array.isArray(pageData?.motorcycles) && (
            <MotorcycleManagement
              motorcycles={filteredMotorcycles}
              onCreate={createMotorcycle}
              onEdit={editMotorcycle}
              onDelete={deleteMotorcycle}
              error={motorcycleMutationError}
            />
          )}
          {motorcycleEditor !== undefined && pathname === '/admin/motorcycles' && (
            <MotorcycleEditor
              motorcycle={motorcycleEditor}
              onClose={() => setMotorcycleEditor(undefined)}
              onSave={saveMotorcycle}
              saving={savingMotorcycle}
              error={motorcycleMutationError}
            />
          )}
          {!loadingPage && !pageError && pathname === '/admin/service-videos' && Array.isArray(pageData?.videos) && (
            <section className="admin-video-grid" aria-label="Service video source files">
              <p className="admin-video-note">Current public files are listed in playback order. Preview is available; replacement, upload, deletion, and reordering are disabled until database and object storage are connected.</p>
              {filteredVideos.map((video) => (
                <article className="admin-video-card" key={video.filename}>
                  <div className="admin-video-card__preview">
                    <video src={video.path} controls muted playsInline preload="none" aria-label={`Preview ${video.filename}`} />
                    <span className="admin-video-order">{String(video.order).padStart(2, '0')}</span>
                  </div>
                  <div className="admin-video-card__details">
                    <div><strong>{video.filename}</strong><span>{formatBytes(video.sizeBytes)}</span></div>
                    <code>{video.path}</code>
                  </div>
                </article>
              ))}
              {filteredVideos.length === 0 && (
                <p className="admin-panel admin-video-empty">No videos match this search.</p>
              )}
            </section>
          )}
          {!loadingPage && !pageError && !['/admin', '/admin/motorcycles', '/admin/service-videos', '/admin/bookings', '/admin/analytics', '/admin/social', '/admin/social/posts', '/admin/enquiries', '/admin/reviews', '/admin/gallery', '/admin/content', '/admin/profile'].includes(pathname) && (
            <section className="admin-panel admin-module-notice">
              <span className="admin-module-notice__icon" aria-hidden="true">DB</span>
              <span className="admin-eyebrow">PERSISTENCE NOT CONFIGURED</span>
              <h2>This module needs a database.</h2>
              <p>MongoDB Atlas is not connected. Editing, publishing, role administration, SEO changes, activity history, uploads, and media ordering are intentionally unavailable until the database and object storage are provisioned.</p>
              <a href="/admin" onClick={(event) => navigate(event, '/admin')}>Return to dashboard <span>↗</span></a>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function YamahaAdmin() {
  return DEMO_MODE_ENABLED ? <AdminDemoMode /> : <YamahaAdminApi />;
}

export default YamahaAdmin;
