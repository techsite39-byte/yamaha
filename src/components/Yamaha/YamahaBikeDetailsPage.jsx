import React, { useEffect, useMemo, useRef, useState } from 'react';
import YamahaBikeImage from './YamahaBikeImage.jsx';
import {
  formatINR,
  getCataloguePrice,
  getMotorcycleSlug,
} from './yamahaCatalogueUtils.js';
import './YamahaBikeDetailsPage.css';

const DEALERSHIP_INFO = {
  name: 'Vathilai Motors — Authorised Yamaha Dealer',
  phone: '+91 98401 23456',
  phoneClean: '+919840123456',
  whatsapp: '+91 98401 23456',
  whatsappUrl: 'https://wa.me/919840123456',
  email: 'enquiries@vathilaimotors.com',
  address: '142 Anna Salai, Thousand Lights, Chennai, Tamil Nadu 600006',
  hours: 'Mon–Sat: 9:00 AM – 8:00 PM | Sun: 10:00 AM – 5:00 PM',
  directionsUrl: 'https://maps.google.com/?q=Vathilai+Motors+142+Anna+Salai+Thousand+Lights+Chennai',
};

const CONTACT_METHODS = [
  { id: 'call', label: 'Call', icon: '📞' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { id: 'email', label: 'Email', icon: '✉' },
];

function SpecificationsSection({ motorcycle }) {
  const specs = motorcycle.catalogue?.specifications ?? [];
  const sections = ['Engine', 'Dimensions', 'Brakes and tyres', 'Features'];
  const populated = sections.filter((s) => specs.some((row) => row.section === s));

  if (!populated.length) {
    return (
      <div className="yamaha-details__spec-card yamaha-details__spec-card--empty">
        <p>Manufacturer technical specifications are available directly at the dealership.</p>
      </div>
    );
  }

  return (
    <div className="yamaha-details__specs-grid">
      {populated.map((section) => (
        <article key={section} className="yamaha-details__spec-card">
          <h4>{section}</h4>
          <dl>
            {specs
              .filter((row) => row.section === section)
              .map(({ label, value }) => (
                <div key={`${section}-${label}`}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
        </article>
      ))}
    </div>
  );
}

function YamahaBikeDetailsPage({
  motorcycle,
  motorcycles = [],
  onBack,
  onBookBike,
  onSelectBike,
  onContact,
}) {
  const variants = motorcycle.catalogue?.variants ?? [];
  const colors = motorcycle.catalogue?.colors ?? [];
  const [selectedVariant, setSelectedVariant] = useState(variants[0] ?? '');
  const [activeImage, setActiveImage] = useState(0);
  const [presentationTab, setPresentationTab] = useState('overview');

  // Enquiry form state
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: 'Chennai',
    contactMethod: 'Call',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [reference, setReference] = useState('');
  const submissionId = useRef('');
  const enquirySectionRef = useRef(null);

  const gallery = useMemo(
    () => [...new Set([motorcycle.image, ...(motorcycle.catalogue?.gallery ?? [])].filter(Boolean))],
    [motorcycle],
  );

  const price = useMemo(
    () => getCataloguePrice(motorcycle, 'Chennai', selectedVariant),
    [motorcycle, selectedVariant],
  );

  const currentIndex = motorcycles.findIndex((bike) => bike.id === motorcycle.id);

  // Keyboard navigation for motorcycle cycling
  useEffect(() => {
    const handleArrowKeys = (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) return;
      if (event.target instanceof Element && event.target.closest('button, a, input, select, textarea')) return;
      if (event.key === 'ArrowLeft' && currentIndex >= 0) {
        event.preventDefault();
        onSelectBike(motorcycles[(currentIndex - 1 + motorcycles.length) % motorcycles.length].id);
      } else if (event.key === 'ArrowRight' && currentIndex >= 0) {
        event.preventDefault();
        onSelectBike(motorcycles[(currentIndex + 1) % motorcycles.length].id);
      }
    };
    window.addEventListener('keydown', handleArrowKeys);
    return () => window.removeEventListener('keydown', handleArrowKeys);
  }, [currentIndex, motorcycles, onSelectBike]);

  const navigateBike = (offset) => {
    if (currentIndex < 0 || !motorcycles.length) return;
    const nextIndex = (currentIndex + offset + motorcycles.length) % motorcycles.length;
    onSelectBike(motorcycles[nextIndex].id);
  };

  const scrollToEnquiry = () => {
    enquirySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      const nameInput = document.querySelector('input[name="name"]');
      nameInput?.focus();
    }, 450);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    submissionId.current = '';
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleEnquirySubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || form.name.trim().length < 2) {
      setFormError('Please enter your full name (minimum 2 characters).');
      return;
    }

    const cleanPhone = form.phone.replace(/[\s-]/g, '');
    if (!/^(?:\+?91)?[6-9]\d{9}$/.test(cleanPhone)) {
      setFormError('Please enter a valid 10-digit Indian mobile number (e.g. 9840123456).');
      return;
    }

    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (!form.city.trim()) {
      setFormError('Please enter your city.');
      return;
    }

    if (!form.contactMethod) {
      setFormError('Please select a preferred contact method (Call, WhatsApp, or Email).');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      if (!submissionId.current) {
        submissionId.current = globalThis.crypto?.randomUUID?.()
          ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }

      const response = await fetch('/api/public/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: submissionId.current,
          motorcycleId: motorcycle.id,
          slug: getMotorcycleSlug(motorcycle),
          model: motorcycle.model,
          variant: selectedVariant || 'Standard',
          city: form.city.trim(),
          priceCity: 'Chennai',
          exShowroom: price?.exShowroom ?? null,
          onRoad: price?.onRoad ?? null,
          enquiry: true,
          dealership: DEALERSHIP_INFO.name,
          customer: {
            name: form.name.trim(),
            phone: cleanPhone,
            email: form.email.trim(),
            city: form.city.trim(),
            preferredContactMethod: form.contactMethod,
            dealership: DEALERSHIP_INFO.name,
            message: form.message.trim() || `Customer enquiry for ${motorcycle.model} (${selectedVariant || 'Standard'}).`,
          },
          consent: true,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.message || result?.error || 'Could not submit your enquiry. Please check your details and try again.');
      }

      if (typeof result?.reference !== 'string' || !result.reference.trim()) {
        throw new Error('The server did not return a confirmation reference.');
      }

      setReference(result.reference);
    } catch (error) {
      setFormError(error.message || 'Could not submit your enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetEnquiry = () => {
    setReference('');
    submissionId.current = '';
    setFormError('');
    setForm({
      name: '',
      phone: '',
      email: '',
      city: 'Chennai',
      contactMethod: 'Call',
      message: '',
    });
  };

  const activeMotorcycleImage = gallery[activeImage] ?? motorcycle.image;
  const specificationList = motorcycle.catalogue?.specifications ?? [];
  const features = motorcycle.features ?? [];

  return (
    <main className="yamaha-bike-detail">
      {/* ==================================================
          LEFT PANEL (53% width, Premium Yamaha Blue Gradient)
      ================================================== */}
      <section className="yamaha-details__presentation" aria-label={`${motorcycle.model} presentation`}>
        <div className="yamaha-details__presentation-top">
          <div className="yamaha-details__brand">
            <span>VATHILAI MOTORS</span>
            <span className="yamaha-details__brand-sep">/</span>
            <span>YAMAHA INDIA RANGE</span>
          </div>
          {motorcycles.length > 1 && (
            <div className="yamaha-details__bike-nav" aria-label="Browse motorcycles">
              <button type="button" onClick={() => navigateBike(-1)} aria-label="Previous motorcycle">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <span>{String(currentIndex + 1).padStart(2, '0')} / {String(motorcycles.length).padStart(2, '0')}</span>
              <button type="button" onClick={() => navigateBike(1)} aria-label="Next motorcycle">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            </div>
          )}
        </div>

        {/* Large Motorcycle Photograph Stage */}
        <div className="yamaha-details__image-stage">
          <YamahaBikeImage
            src={activeMotorcycleImage}
            alt={motorcycle.model}
            className="yamaha-details__motorcycle-image"
            loading="eager"
          />
          <span className="yamaha-details__image-caption">OFFICIAL YAMAHA GENUINE MOTORCYCLE</span>

          {gallery.length > 1 && (
            <div className="yamaha-details__thumbnails" role="group" aria-label="Motorcycle gallery">
              {gallery.map((galleryImage, index) => (
                <button
                  type="button"
                  className={index === activeImage ? 'is-selected' : ''}
                  key={galleryImage}
                  aria-label={`View photo ${index + 1}`}
                  onClick={() => setActiveImage(index)}
                >
                  <YamahaBikeImage src={galleryImage} alt="" className="yamaha-details__thumb-img" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Presentation Copy & Tabs */}
        <div className="yamaha-details__presentation-copy">
          <p className="yamaha-details__eyebrow">
            {motorcycle.category} · {motorcycle.catalogue?.category || 'SPORT'}
          </p>
          <h1>{motorcycle.model}</h1>
          <p className="yamaha-details__variant-line">
            {selectedVariant || 'Standard Variant'}
            <span className="yamaha-details__dot">·</span> Chennai Showroom
          </p>

          <div className="yamaha-details__tabs" role="tablist" aria-label="Motorcycle information">
            <button
              type="button"
              role="tab"
              aria-selected={presentationTab === 'overview'}
              className={presentationTab === 'overview' ? 'is-active' : ''}
              onClick={() => setPresentationTab('overview')}
            >
              OVERVIEW
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={presentationTab === 'specifications'}
              className={presentationTab === 'specifications' ? 'is-active' : ''}
              onClick={() => setPresentationTab('specifications')}
            >
              SPECIFICATIONS
            </button>
          </div>

          <div className="yamaha-details__tab-panel" role="tabpanel">
            {presentationTab === 'overview' ? (
              <>
                <p className="yamaha-details__description">{motorcycle.description}</p>
                {features.length > 0 && (
                  <ul className="yamaha-details__highlights">
                    {features.slice(0, 3).map((feature) => (
                      <li key={feature.title}>
                        <strong>{feature.title}</strong>
                        {feature.description && <span>{feature.description}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <div className="yamaha-details__quick-specs">
                {specificationList.length ? (
                  specificationList.slice(0, 6).map(({ label, value }) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))
                ) : (
                  <p>Manufacturer technical specifications are verified with the showroom.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Price Presentation Card */}
        <section className="yamaha-details__price-card" aria-label="Motorcycle pricing">
          <div className="yamaha-details__price-header">
            <span>EX-SHOWROOM · CHENNAI</span>
            <strong>{formatINR(price?.exShowroom)}</strong>
          </div>
          <div className="yamaha-details__price-lines">
            <div>
              <span>Selected Variant</span>
              <strong>{selectedVariant || 'Standard'}</strong>
            </div>
            {Number.isFinite(price?.onRoad) && (
              <div className="yamaha-details__on-road-line">
                <span>Estimated On-Road (Chennai)</span>
                <strong>{formatINR(price?.onRoad)}</strong>
              </div>
            )}
          </div>
          <p className="yamaha-details__price-note">
            Indicative ex-showroom and on-road prices for Chennai. Final on-road pricing, road tax, and insurance are confirmed at the showroom.
          </p>

          <div className="yamaha-details__cta-group">
            <button
              type="button"
              className="yamaha-details__btn-book"
              onClick={() => onBookBike(motorcycle.id, selectedVariant)}
            >
              <span>BOOK THIS MOTORCYCLE</span>
              <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              className="yamaha-details__btn-enquire"
              onClick={scrollToEnquiry}
            >
              ENQUIRE ABOUT THIS MOTORCYCLE ↓
            </button>
          </div>
        </section>
      </section>

      {/* ==================================================
          RIGHT PANEL (47% width, Clean Light Background)
      ================================================== */}
      <section className="yamaha-details__content" aria-label="Specifications and dealership enquiry">
        <button type="button" className="yamaha-details__back-link" onClick={onBack}>
          <span aria-hidden="true">←</span> BACK TO MOTORCYCLES
        </button>

        <p className="yamaha-details__right-eyebrow">SPECIFICATIONS & DEALERSHIP ENQUIRY</p>
        <h2 className="yamaha-details__right-title">Configure & Enquire: {motorcycle.model}</h2>
        <p className="yamaha-details__right-intro">
          Review verified manufacturer technical details and submit your enquiry directly to Vathilai Motors.
        </p>

        {/* Selected Motorcycle Summary */}
        <div className="yamaha-details__summary-card">
          <span className="yamaha-details__tag">SELECTED MODEL</span>
          <h3>{motorcycle.model}</h3>
          <p>{motorcycle.category} · {motorcycle.catalogue?.category || 'SPORT'}</p>

          {variants.length > 1 && (
            <label className="yamaha-details__variant-selector">
              <span>SELECT VARIANT</span>
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
              >
                {variants.map((v) => (
                  <option value={v} key={v}>{v}</option>
                ))}
              </select>
            </label>
          )}

          {colors.length > 0 && (
            <div className="yamaha-details__colors-available">
              <span>VERIFIED FACTORY COLOURS</span>
              <div className="yamaha-details__color-tags">
                {colors.map((c) => (
                  <span key={c} className="yamaha-details__color-tag">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Verified Technical Specifications */}
        <div className="yamaha-details__section-heading">
          <span className="yamaha-details__step-num">01</span>
          <div>
            <h3>Verified Manufacturer Specifications</h3>
            <p>Official technical figures from Yamaha Motor India.</p>
          </div>
        </div>

        <SpecificationsSection motorcycle={motorcycle} />

        {motorcycle.catalogue?.officialSourceUrl && (
          <p className="yamaha-details__source-url">
            <span>Official manufacturer source:</span>{' '}
            <a href={motorcycle.catalogue.officialSourceUrl} target="_blank" rel="noopener noreferrer">
              Yamaha Motor India Official Page ↗
            </a>
          </p>
        )}

        {/* Dealership Contact Details Section - 4 Contact Cards */}
        <div className="yamaha-details__section-heading" style={{ marginTop: 40 }}>
          <span className="yamaha-details__step-num">02</span>
          <div>
            <h3>Contact Our Dealership</h3>
            <p>Visit our authorised Chennai showroom or connect directly with our sales specialists.</p>
          </div>
        </div>

        <section className="yamaha-details__dealership-section" aria-label="Dealership contact information">
          <div className="yamaha-details__contact-cards">
            {/* 1. Phone — Call Us */}
            <article className="yamaha-details__contact-card">
              <div className="yamaha-details__contact-card-icon" aria-hidden="true">📞</div>
              <div className="yamaha-details__contact-card-content">
                <span className="yamaha-details__contact-card-channel">PHONE</span>
                <h4 className="yamaha-details__contact-card-title">Call Us</h4>
                <p className="yamaha-details__contact-card-val">{DEALERSHIP_INFO.phone}</p>
                <small className="yamaha-details__contact-card-note">Direct sales enquiry</small>
              </div>
              <a href={`tel:${DEALERSHIP_INFO.phoneClean}`} className="yamaha-details__contact-card-btn">
                CALL NOW
              </a>
            </article>

            {/* 2. WhatsApp — WhatsApp Enquiry */}
            <article className="yamaha-details__contact-card yamaha-details__contact-card--whatsapp">
              <div className="yamaha-details__contact-card-icon" aria-hidden="true">💬</div>
              <div className="yamaha-details__contact-card-content">
                <span className="yamaha-details__contact-card-channel">WHATSAPP</span>
                <h4 className="yamaha-details__contact-card-title">WhatsApp Enquiry</h4>
                <p className="yamaha-details__contact-card-val">{DEALERSHIP_INFO.whatsapp}</p>
                <small className="yamaha-details__contact-card-note">Instant product specialist chat</small>
              </div>
              <a
                href={`${DEALERSHIP_INFO.whatsappUrl}?text=${encodeURIComponent(`Hello Vathilai Motors, I am enquiring about the ${motorcycle.model}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="yamaha-details__contact-card-btn yamaha-details__contact-card-btn--whatsapp"
              >
                WHATSAPP ENQUIRY
              </a>
            </article>

            {/* 3. Email — Email Us */}
            <article className="yamaha-details__contact-card">
              <div className="yamaha-details__contact-card-icon" aria-hidden="true">✉</div>
              <div className="yamaha-details__contact-card-content">
                <span className="yamaha-details__contact-card-channel">EMAIL</span>
                <h4 className="yamaha-details__contact-card-title">Email Us</h4>
                <p className="yamaha-details__contact-card-val">{DEALERSHIP_INFO.email}</p>
                <small className="yamaha-details__contact-card-note">Written quotation & specs</small>
              </div>
              <a
                href={`mailto:${DEALERSHIP_INFO.email}?subject=${encodeURIComponent(`Enquiry: ${motorcycle.model}`)}`}
                className="yamaha-details__contact-card-btn"
              >
                EMAIL US
              </a>
            </article>

            {/* 4. Location — Get Directions */}
            <article className="yamaha-details__contact-card yamaha-details__contact-card--location">
              <div className="yamaha-details__contact-card-icon" aria-hidden="true">📍</div>
              <div className="yamaha-details__contact-card-content">
                <span className="yamaha-details__contact-card-channel">LOCATION</span>
                <h4 className="yamaha-details__contact-card-title">Get Directions</h4>
                <p className="yamaha-details__contact-card-val">{DEALERSHIP_INFO.address}</p>
                <small className="yamaha-details__contact-card-note">{DEALERSHIP_INFO.hours}</small>
              </div>
              <a
                href={DEALERSHIP_INFO.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="yamaha-details__contact-card-btn yamaha-details__contact-card-btn--location"
              >
                GET DIRECTIONS
              </a>
            </article>
          </div>
        </section>

        {/* Motorcycle Enquiry Form */}
        <div ref={enquirySectionRef} className="yamaha-details__section-heading" style={{ marginTop: 40 }}>
          <span className="yamaha-details__step-num">03</span>
          <div>
            <h3>ENQUIRE ABOUT THIS MOTORCYCLE</h3>
            <p>Submit your details to receive priority pricing, availability, and showroom consultation.</p>
          </div>
        </div>

        {reference ? (
          <div className="yamaha-details__enquiry-success" role="alert">
            <div className="yamaha-details__success-icon-wrap" aria-hidden="true">✓</div>
            <span className="yamaha-details__success-eyebrow">CONFIRMATION</span>
            <h3 className="yamaha-details__success-title">ENQUIRY SUBMITTED SUCCESSFULLY</h3>
            <p className="yamaha-details__success-lead">
              Thank you for your interest in Vathilai Motors.
            </p>

            <div className="yamaha-details__success-summary-box">
              <div className="yamaha-details__success-row">
                <span>Enquiry Reference:</span>
                <strong className="yamaha-details__success-ref">{reference}</strong>
              </div>
              <div className="yamaha-details__success-row">
                <span>Selected Motorcycle:</span>
                <strong>{motorcycle.model} ({selectedVariant || 'Standard'})</strong>
              </div>
              <div className="yamaha-details__success-row">
                <span>Customer Name:</span>
                <strong>{form.name}</strong>
              </div>
              <div className="yamaha-details__success-row">
                <span>Mobile Number:</span>
                <strong>{form.phone}</strong>
              </div>
              <div className="yamaha-details__success-row">
                <span>Preferred Contact:</span>
                <strong>{form.contactMethod}</strong>
              </div>
            </div>

            <div className="yamaha-details__success-dealership-card">
              <h4>DEALERSHIP DETAILS</h4>
              <p><strong>{DEALERSHIP_INFO.name}</strong></p>
              <p>{DEALERSHIP_INFO.address}</p>
              <p>Phone: <a href={`tel:${DEALERSHIP_INFO.phoneClean}`}>{DEALERSHIP_INFO.phone}</a> · Email: <a href={`mailto:${DEALERSHIP_INFO.email}`}>{DEALERSHIP_INFO.email}</a></p>
              <p><small>{DEALERSHIP_INFO.hours}</small></p>
            </div>

            <div className="yamaha-details__success-actions">
              <button
                type="button"
                className="yamaha-details__btn-back-motorcycles"
                onClick={onBack}
              >
                ← BACK TO MOTORCYCLES
              </button>
              <button
                type="button"
                className="yamaha-details__btn-sub-another"
                onClick={handleResetEnquiry}
              >
                SUBMIT ANOTHER ENQUIRY
              </button>
            </div>
          </div>
        ) : (
          <form className="yamaha-details__enquiry-form" onSubmit={handleEnquirySubmit} noValidate>
            <div className="yamaha-details__form-header">
              <h4>Enquire About This Motorcycle</h4>
              <span className="yamaha-details__form-subtitle">
                Official dealership enquiry for {motorcycle.model} at Vathilai Motors
              </span>
            </div>

            {/* Auto-identified motorcycle banner */}
            <div className="yamaha-details__auto-selected-badge">
              <div className="yamaha-details__auto-selected-thumb">
                <YamahaBikeImage src={activeMotorcycleImage} alt={motorcycle.model} />
              </div>
              <div className="yamaha-details__auto-selected-meta">
                <span className="yamaha-details__auto-tag">CURRENT SELECTION</span>
                <h5>{motorcycle.model}</h5>
                <p>{selectedVariant || 'Standard Variant'} · {motorcycle.category}</p>
                <div className="yamaha-details__auto-prices">
                  <span>Ex-Showroom: <strong>{formatINR(price?.exShowroom)}</strong></span>
                  {Number.isFinite(price?.onRoad) && (
                    <span>Estimated On-Road: <strong>{formatINR(price?.onRoad)}</strong></span>
                  )}
                  <span>City: <strong>{form.city || 'Chennai'}</strong></span>
                </div>
              </div>
            </div>

            {formError && (
              <div className="yamaha-details__form-error" role="alert">
                <strong>Attention:</strong> {formError}
              </div>
            )}

            <div className="yamaha-details__form-grid">
              <label className="yamaha-details__field">
                <span>FULL NAME <b aria-hidden="true">*</b></span>
                <input
                  name="name"
                  type="text"
                  maxLength="100"
                  placeholder="Your full name"
                  required
                  value={form.name}
                  onChange={handleFormChange}
                />
              </label>

              <label className="yamaha-details__field">
                <span>MOBILE NUMBER <b aria-hidden="true">*</b></span>
                <input
                  name="phone"
                  type="tel"
                  maxLength="15"
                  placeholder="10-digit number e.g. 9840123456"
                  required
                  value={form.phone}
                  onChange={handleFormChange}
                />
                <small>Indian mobile number</small>
              </label>

              <label className="yamaha-details__field">
                <span>EMAIL ADDRESS <b aria-hidden="true">*</b></span>
                <input
                  name="email"
                  type="email"
                  maxLength="254"
                  placeholder="name@example.com"
                  required
                  value={form.email}
                  onChange={handleFormChange}
                />
              </label>

              <label className="yamaha-details__field">
                <span>CITY <b aria-hidden="true">*</b></span>
                <input
                  name="city"
                  type="text"
                  maxLength="80"
                  placeholder="Your city"
                  required
                  value={form.city}
                  onChange={handleFormChange}
                />
              </label>

              <div className="yamaha-details__field yamaha-details__field--full">
                <span>PREFERRED CONTACT METHOD <b aria-hidden="true">*</b></span>
                <div className="yamaha-details__method-chips" role="radiogroup" aria-label="Preferred contact method">
                  {CONTACT_METHODS.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      role="radio"
                      aria-checked={form.contactMethod === m.label}
                      className={`yamaha-details__method-chip ${form.contactMethod === m.label ? 'is-selected' : ''}`}
                      onClick={() => {
                        submissionId.current = '';
                        setForm((curr) => ({ ...curr, contactMethod: m.label }));
                      }}
                    >
                      <span className="yamaha-details__chip-radio-circle" aria-hidden="true" />
                      <span className="yamaha-details__chip-icon" aria-hidden="true">{m.icon}</span>
                      <span className="yamaha-details__chip-label">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="yamaha-details__field yamaha-details__field--full">
                <span>YOUR MESSAGE (OPTIONAL)</span>
                <textarea
                  name="message"
                  rows="3"
                  maxLength="1000"
                  placeholder="Ask about availability, delivery timeline, on-road quotation, or exchange offers."
                  value={form.message}
                  onChange={handleFormChange}
                />
              </label>
            </div>

            <button
              type="submit"
              className="yamaha-details__enquiry-submit-btn"
              disabled={submitting}
            >
              {submitting ? 'SUBMITTING ENQUIRY…' : 'SUBMIT ENQUIRY'}
            </button>
            <p className="yamaha-details__form-footnote">
              Your contact details are encrypted and sent directly to Vathilai Motors. We never share your personal information.
            </p>
          </form>
        )}
      </section>
    </main>
  );
}

export default YamahaBikeDetailsPage;
