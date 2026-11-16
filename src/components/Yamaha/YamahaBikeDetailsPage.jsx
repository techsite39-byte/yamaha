import React, { useEffect, useMemo, useRef, useState } from 'react';
import YamahaBikeImage from './YamahaBikeImage.jsx';
import {
  formatINR,
  getCataloguePrice,
  getMotorcycleSlug,
} from './yamahaCatalogueUtils.js';
import { getDirectionsUrl, getPhoneHref } from './businessConfig.js';
import { useBusinessSettings } from './useBusinessSettings.js';
import './YamahaBikeDetailsPage.css';

const CONTACT_METHODS = [
  { id: 'call', label: 'Call', icon: 'phone' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp' },
  { id: 'email', label: 'Email', icon: 'mail' },
];

function LucideIcon({ name }) {
  if (name === 'phone') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    );
  }
  if (name === 'whatsapp') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    );
  }
  if (name === 'mail') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    );
  }
  if (name === 'map-pin') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    );
  }
  if (name === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" />
      </svg>
    );
  }
  if (name === 'shield-check') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }
  if (name === 'wrench') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    );
  }
  if (name === 'award') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </svg>
    );
  }
  if (name === 'star') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  }
  if (name === 'check-circle') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    );
  }
  if (name === 'gauge') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m12 14 4-4" />
        <path d="M3.34 19a10 10 0 1 1 17.32 0" />
      </svg>
    );
  }
  if (name === 'zap') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    );
  }
  if (name === 'rotate-cw') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
      </svg>
    );
  }
  if (name === 'settings') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    );
  }
  return null;
}

export function YamahaBikeDetailsPage({
  motorcycle,
  motorcycles = [],
  onBack,
  onBookBike,
  onSelectBike,
}) {
  const { business: dealership } = useBusinessSettings();
  const variants = motorcycle.catalogue?.variants ?? ['Standard'];
  const [selectedVariant, setSelectedVariant] = useState(variants[0] ?? 'Standard');
  const [activeImage, setActiveImage] = useState(0);
  const [headerTab, setHeaderTab] = useState('overview');

  // Form State
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    contactMethod: 'Call',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [submittedEnquiry, setSubmittedEnquiry] = useState(null);
  const formRef = useRef(null);
  const isSubmittingRef = useRef(false);

  const gallery = useMemo(() => {
    const list = [motorcycle.image, ...(motorcycle.catalogue?.gallery ?? [])].filter(Boolean);
    return [...new Set(list)];
  }, [motorcycle]);

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
      if (event.key === 'ArrowLeft' && currentIndex >= 0 && motorcycles.length > 1 && onSelectBike) {
        event.preventDefault();
        onSelectBike(motorcycles[(currentIndex - 1 + motorcycles.length) % motorcycles.length].id);
      } else if (event.key === 'ArrowRight' && currentIndex >= 0 && motorcycles.length > 1 && onSelectBike) {
        event.preventDefault();
        onSelectBike(motorcycles[(currentIndex + 1) % motorcycles.length].id);
      }
    };
    window.addEventListener('keydown', handleArrowKeys);
    return () => window.removeEventListener('keydown', handleArrowKeys);
  }, [currentIndex, motorcycles, onSelectBike]);

  const navigateBike = (offset) => {
    if (currentIndex < 0 || !motorcycles.length || !onSelectBike) return;
    const nextIndex = (currentIndex + offset + motorcycles.length) % motorcycles.length;
    onSelectBike(motorcycles[nextIndex].id);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (formError) setFormError('');
  };

  const handleClearForm = () => {
    setForm({
      name: '',
      phone: '',
      email: '',
      city: '',
      contactMethod: 'Call',
      message: '',
    });
    setFormError('');
  };

  const handleEnquirySubmit = async (event) => {
    event.preventDefault();
    if (isSubmittingRef.current || submitting) return;

    // Field Validation
    const trimmedName = form.name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setFormError('Please enter your full name (2 to 100 characters).');
      return;
    }

    const cleanPhone = form.phone.replace(/[\s-]/g, '');
    if (!/^(?:\+?91)?[6-9]\d{9}$/.test(cleanPhone)) {
      setFormError('Please enter a valid 10-digit Indian mobile number (e.g. 9841234567).');
      return;
    }

    const trimmedEmail = form.email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    const trimmedCity = form.city.trim();
    if (!trimmedCity || trimmedCity.length < 2) {
      setFormError('Please enter your city.');
      return;
    }

    if (!CONTACT_METHODS.some((method) => method.label === form.contactMethod)) {
      setFormError('Please select a preferred contact method (Call, WhatsApp, or Email).');
      return;
    }

    isSubmittingRef.current = true;
    setSubmitting(true);
    setFormError('');

    try {
      const payload = {
        requestId: `enq-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        motorcycleId: motorcycle.id,
        slug: getMotorcycleSlug(motorcycle),
        model: motorcycle.model,
        variant: selectedVariant || 'Standard',
        category: motorcycle.category || 'Sport',
        city: trimmedCity,
        priceCity: 'Chennai',
        exShowroom: price?.exShowroom ?? null,
        enquiry: true,
        source: 'motorcycle-details',
        customerName: trimmedName,
        mobileNumber: cleanPhone,
        email: trimmedEmail,
        preferredContactMethod: form.contactMethod,
        message: form.message.trim() || `Enquiry for ${motorcycle.model} (${selectedVariant || 'Standard'}).`,
        customer: {
          name: trimmedName,
          phone: cleanPhone,
          email: trimmedEmail,
          city: trimmedCity,
          preferredContactMethod: form.contactMethod,
          dealership: dealership.dealershipName || 'Vathilai Motors — Batlagundu',
          message: form.message.trim() || `Enquiry for ${motorcycle.model} (${selectedVariant || 'Standard'}).`,
        },
        consent: true,
      };

      const response = await fetch('/api/public/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || result?.error || 'Could not submit your enquiry. Please check your details.');
      }

      const returnedRef = result?.reference || result?.enquiryId || result?.booking?.reference;
      if (!returnedRef) {
        throw new Error('Server confirmed enquiry but did not return a reference code.');
      }

      setSubmittedEnquiry({
        reference: returnedRef,
        customerName: trimmedName,
        phone: cleanPhone,
        email: trimmedEmail,
        city: trimmedCity,
        contactMethod: form.contactMethod,
        motorcycleModel: motorcycle.model,
        variant: selectedVariant || 'Standard',
        date: new Date().toLocaleDateString(),
      });
    } catch (error) {
      setFormError(error.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  const activeMotorcycleImage = gallery[activeImage] ?? motorcycle.image;
  const specificationList = motorcycle.catalogue?.specifications ?? [];

  // Key technical specifications
  const keySpecs = useMemo(() => {
    const specs = motorcycle.catalogue?.specifications ?? [];
    const findSpec = (keyword) =>
      specs.find((s) => s.label.toLowerCase().includes(keyword.toLowerCase()))?.value;

    return [
      {
        id: 'displacement',
        label: 'Displacement',
        value: motorcycle.displacementCc
          ? `${motorcycle.displacementCc} cc`
          : findSpec('displacement') || findSpec('engine') || '—',
        icon: 'gauge',
      },
      {
        id: 'power',
        label: 'Max Power',
        value: findSpec('power') || motorcycle.specs?.power || '—',
        icon: 'zap',
      },
      {
        id: 'torque',
        label: 'Max Torque',
        value: findSpec('torque') || motorcycle.specs?.torque || '—',
        icon: 'rotate-cw',
      },
      {
        id: 'transmission',
        label: 'Transmission',
        value: findSpec('transmission') || findSpec('gear') || 'Constant Mesh, 6-Speed',
        icon: 'settings',
      },
      {
        id: 'weight',
        label: 'Kerb Weight',
        value: findSpec('weight') || motorcycle.specs?.weight || '—',
        icon: 'shield-check',
      },
      {
        id: 'tank',
        label: 'Fuel Tank Capacity',
        value: findSpec('fuel') || findSpec('tank') || '—',
        icon: 'award',
      },
    ].filter((item) => item.value !== '—');
  }, [motorcycle]);

  return (
    <main className="vathilai-bike-details">
      <div className="vathilai-details-container">
        
        {/* =================================================================
            SECTION 1 – COMPACT MOTORCYCLE HEADER
            - Vathilai Motors branding
            - Yamaha motorcycle category
            - Selected motorcycle name
            - Motorcycle category and short description
            - Official motorcycle image
            - Overview and Specifications tabs
        ================================================================== */}
        <section className="vathilai-header-card" aria-label="Motorcycle Showcase">
          {/* Top Bar with Branding & Navigation */}
          <div className="vathilai-header-bar">
            <div className="vathilai-header-branding">
              <span className="vathilai-brand-name">VATHILAI MOTORS</span>
              <span className="vathilai-brand-separator">/</span>
              <span className="vathilai-brand-sub">AUTHORISED YAMAHA DEALER</span>
            </div>

            <div className="vathilai-header-nav-actions">
              {onBack && (
                <button type="button" className="vathilai-back-btn" onClick={onBack}>
                  <span>←</span> Back to Fleet
                </button>
              )}
              {motorcycles.length > 1 && (
                <div className="vathilai-bike-cycler">
                  <button type="button" onClick={() => navigateBike(-1)} aria-label="Previous motorcycle">
                    ‹
                  </button>
                  <span>{String(currentIndex + 1).padStart(2, '0')} / {String(motorcycles.length).padStart(2, '0')}</span>
                  <button type="button" onClick={() => navigateBike(1)} aria-label="Next motorcycle">
                    ›
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Model Title & Category */}
          <div className="vathilai-header-intro">
            <div className="vathilai-category-badge">{motorcycle.category || 'YAMAHA MOTORCYCLE'}</div>
            <h1 className="vathilai-model-title">{motorcycle.model}</h1>
            <p className="vathilai-model-tagline">
              {motorcycle.tagline || motorcycle.description || 'Engineered for exceptional performance, sharp handling, and pure Yamaha racing DNA.'}
            </p>
          </div>

          {/* Official Motorcycle Image Stage */}
          <div className="vathilai-image-stage">
            <div className="vathilai-image-wrapper">
              <YamahaBikeImage
                src={activeMotorcycleImage}
                alt={motorcycle.model}
                className="vathilai-hero-bike-img"
                loading="eager"
              />
            </div>

            {/* Thumbnail selector if multiple images exist */}
            {gallery.length > 1 && (
              <div className="vathilai-thumbnails-strip">
                {gallery.map((img, idx) => (
                  <button
                    key={img}
                    type="button"
                    className={`vathilai-thumb-btn ${idx === activeImage ? 'is-active' : ''}`}
                    onClick={() => setActiveImage(idx)}
                    aria-label={`View angle ${idx + 1}`}
                  >
                    <YamahaBikeImage src={img} alt="" className="vathilai-thumb-img" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Overview / Specifications Tabs */}
          <div className="vathilai-header-tabs-container">
            <div className="vathilai-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={headerTab === 'overview'}
                className={`vathilai-tab-btn ${headerTab === 'overview' ? 'is-active' : ''}`}
                onClick={() => setHeaderTab('overview')}
              >
                OVERVIEW
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={headerTab === 'specs'}
                className={`vathilai-tab-btn ${headerTab === 'specs' ? 'is-active' : ''}`}
                onClick={() => setHeaderTab('specs')}
              >
                QUICK SPECIFICATIONS
              </button>
            </div>

            <div className="vathilai-tab-content">
              {headerTab === 'overview' ? (
                <div className="vathilai-tab-overview">
                  <p>{motorcycle.description || 'Experience cutting-edge Yamaha engineering, track-derived aerodynamics, and refined electronic rider aids built for riders who demand unmatched precision.'}</p>
                </div>
              ) : (
                <div className="vathilai-tab-specs-grid">
                  {keySpecs.slice(0, 4).map((spec) => (
                    <div className="vathilai-tab-spec-pill" key={spec.id}>
                      <span className="vathilai-tab-spec-lbl">{spec.label}</span>
                      <strong className="vathilai-tab-spec-val">{spec.value}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =================================================================
            SECTION 2 – ENQUIRY FORM AT THE TOP
            - Heading: "Enquire About This Motorcycle"
            - Subtitle: "Get verified pricing, availability and expert assistance from Vathilai Motors."
            - Compact selected motorcycle information card
            - 2-Column Responsive Form (Full Name, Mobile, Email, City, Preferred Method, Message)
            - Submit Enquiry & Clear Form buttons
        ================================================================== */}
        <section className="vathilai-enquiry-section" aria-label="Enquire About This Motorcycle" ref={formRef}>
          <div className="vathilai-section-header">
            <h2 className="vathilai-section-title">Enquire About This Motorcycle</h2>
            <p className="vathilai-section-subtitle">
              Get verified pricing, availability and expert assistance from Vathilai Motors.
            </p>
          </div>

          {/* Compact Selected Motorcycle Information Card */}
          <div className="vathilai-selected-bike-card">
            <div className="vathilai-selected-thumb">
              <YamahaBikeImage src={activeMotorcycleImage} alt={motorcycle.model} />
            </div>
            <div className="vathilai-selected-info">
              <div className="vathilai-selected-topline">
                <span className="vathilai-selected-id-badge">{motorcycle.id || getMotorcycleSlug(motorcycle)}</span>
                <span className="vathilai-selected-category">{motorcycle.category || 'Yamaha Motorcycle'}</span>
              </div>
              <h3 className="vathilai-selected-title">{motorcycle.model}</h3>

              {/* Variant Selector Pills if multiple variants exist */}
              {variants.length > 1 && (
                <div className="vathilai-variant-picker">
                  <span className="vathilai-variant-picker-label">Variant:</span>
                  <div className="vathilai-variant-pills">
                    {variants.map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={`vathilai-variant-pill ${selectedVariant === v ? 'is-selected' : ''}`}
                        onClick={() => setSelectedVariant(v)}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="vathilai-selected-pricing">
                <span className="vathilai-price-label">Ex-Showroom Price:</span>
                <strong className="vathilai-price-value">
                  {price?.exShowroom ? formatINR(price.exShowroom) : 'Price on request'}
                </strong>
                {onBookBike && (
                  <button
                    type="button"
                    className="vathilai-book-slot-link"
                    onClick={() => onBookBike(motorcycle.id, selectedVariant)}
                  >
                    Book with Showroom Slot →
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form / Success State */}
          {submittedEnquiry ? (
            <div className="vathilai-enquiry-success-box" role="status">
              <div className="vathilai-success-badge-icon">
                <LucideIcon name="check-circle" />
              </div>
              <h3 className="vathilai-success-heading">Enquiry Successfully Submitted</h3>
              <p className="vathilai-success-lead">
                Your enquiry has been successfully submitted to Vathilai Motors. Our dealership team will contact you shortly.
              </p>

              <div className="vathilai-success-details-card">
                <div className="vathilai-success-detail-row">
                  <span>Enquiry Reference ID:</span>
                  <code>{submittedEnquiry.reference}</code>
                </div>
                <div className="vathilai-success-detail-row">
                  <span>Customer Name:</span>
                  <strong>{submittedEnquiry.customerName}</strong>
                </div>
                <div className="vathilai-success-detail-row">
                  <span>Mobile Number:</span>
                  <strong>+91 {submittedEnquiry.phone}</strong>
                </div>
                <div className="vathilai-success-detail-row">
                  <span>Email:</span>
                  <strong>{submittedEnquiry.email}</strong>
                </div>
                <div className="vathilai-success-detail-row">
                  <span>City:</span>
                  <strong>{submittedEnquiry.city}</strong>
                </div>
                <div className="vathilai-success-detail-row">
                  <span>Motorcycle:</span>
                  <strong>{submittedEnquiry.motorcycleModel} ({submittedEnquiry.variant})</strong>
                </div>
                <div className="vathilai-success-detail-row">
                  <span>Preferred Contact:</span>
                  <strong>Via {submittedEnquiry.contactMethod}</strong>
                </div>
              </div>

              <div className="vathilai-success-actions">
                <button
                  type="button"
                  className="vathilai-btn-primary"
                  onClick={() => setSubmittedEnquiry(null)}
                >
                  Submit Another Enquiry
                </button>
                {onBack && (
                  <button
                    type="button"
                    className="vathilai-btn-secondary"
                    onClick={onBack}
                  >
                    ← Back to Motorcycles
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form className="vathilai-form-card" onSubmit={handleEnquirySubmit} noValidate>
              {formError && (
                <div className="vathilai-form-alert" role="alert">
                  <strong>Notice:</strong> {formError}
                </div>
              )}

              <div className="vathilai-form-grid">
                {/* 1. Full Name */}
                <div className="vathilai-input-group">
                  <label htmlFor="enquiry-name">
                    Full Name <span className="vathilai-req">*</span>
                  </label>
                  <input
                    id="enquiry-name"
                    name="name"
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={handleFormChange}
                    autoComplete="name"
                    maxLength={100}
                  />
                </div>

                {/* 2. Mobile Number */}
                <div className="vathilai-input-group">
                  <label htmlFor="enquiry-phone">
                    Mobile Number <span className="vathilai-req">*</span>
                  </label>
                  <input
                    id="enquiry-phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="10-digit number (e.g. 9841234567)"
                    value={form.phone}
                    onChange={handleFormChange}
                    autoComplete="tel"
                    maxLength={15}
                  />
                </div>

                {/* 3. Email Address */}
                <div className="vathilai-input-group">
                  <label htmlFor="enquiry-email">
                    Email Address <span className="vathilai-req">*</span>
                  </label>
                  <input
                    id="enquiry-email"
                    name="email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={handleFormChange}
                    autoComplete="email"
                    maxLength={254}
                  />
                </div>

                {/* 4. City */}
                <div className="vathilai-input-group">
                  <label htmlFor="enquiry-city">
                    City <span className="vathilai-req">*</span>
                  </label>
                  <input
                    id="enquiry-city"
                    name="city"
                    type="text"
                    required
                    placeholder="Your city (e.g. Batlagundu, Dindigul)"
                    value={form.city}
                    onChange={handleFormChange}
                    maxLength={80}
                  />
                </div>

                {/* 5. Preferred Contact Method */}
                <div className="vathilai-input-group vathilai-input-group--full">
                  <span className="vathilai-group-label">
                    Preferred Contact Method <span className="vathilai-req">*</span>
                  </span>
                  <div className="vathilai-contact-method-options" role="radiogroup">
                    {CONTACT_METHODS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        role="radio"
                        aria-checked={form.contactMethod === m.label}
                        className={`vathilai-method-btn ${form.contactMethod === m.label ? 'is-selected' : ''}`}
                        onClick={() => setForm((curr) => ({ ...curr, contactMethod: m.label }))}
                      >
                        <span className="vathilai-method-icon">
                          <LucideIcon name={m.icon} />
                        </span>
                        <span className="vathilai-method-label">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. Message (Optional) */}
                <div className="vathilai-input-group vathilai-input-group--full">
                  <label htmlFor="enquiry-message">Your Message (Optional)</label>
                  <textarea
                    id="enquiry-message"
                    name="message"
                    rows={3}
                    placeholder="Ask about on-road quotation, waiting period, finance offers, or exchange options..."
                    value={form.message}
                    onChange={handleFormChange}
                    maxLength={1000}
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="vathilai-form-buttons">
                <button
                  type="submit"
                  className="vathilai-btn-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting Enquiry...' : 'Submit Enquiry'}
                </button>
                <button
                  type="button"
                  className="vathilai-btn-clear"
                  onClick={handleClearForm}
                  disabled={submitting}
                >
                  Clear Form
                </button>
              </div>

              <p className="vathilai-form-disclaimer">
                Your enquiry is securely transmitted to Vathilai Motors Batlagundu. An authorized representative will contact you with verified details.
              </p>
            </form>
          )}
        </section>

        {/* =================================================================
            SECTION 3 – MOTORCYCLE INFORMATION
            - Overview
            - Key specifications (Transmission, Engine, Performance)
            - Clean specification cards
        ================================================================== */}
        <section className="vathilai-info-section" aria-label="Motorcycle Information">
          <div className="vathilai-section-header">
            <h2 className="vathilai-section-title">Motorcycle Specifications & Highlights</h2>
            <p className="vathilai-section-subtitle">
              Verified Yamaha factory engineering and technical metrics.
            </p>
          </div>

          <div className="vathilai-specs-grid">
            {keySpecs.map((spec) => (
              <div className="vathilai-spec-card" key={spec.id}>
                <div className="vathilai-spec-card-icon">
                  <LucideIcon name={spec.icon} />
                </div>
                <div className="vathilai-spec-card-body">
                  <span className="vathilai-spec-label">{spec.label}</span>
                  <strong className="vathilai-spec-value">{spec.value}</strong>
                </div>
              </div>
            ))}
          </div>

          {specificationList.length > 0 && (
            <div className="vathilai-detailed-specs-card">
              <h4 className="vathilai-detailed-specs-heading">Technical Specifications</h4>
              <div className="vathilai-detailed-specs-table">
                {specificationList.map(({ label, value }) => (
                  <div className="vathilai-spec-row" key={label}>
                    <span className="vathilai-spec-row-label">{label}</span>
                    <span className="vathilai-spec-row-val">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* =================================================================
            SECTION 4 – ABOUT VATHILAI MOTORS
            - Heading: "About Vathilai Motors"
            - Description
            - 3 Concise Benefits with icons:
              * Authorised Sales & Support
              * Factory-Certified Expertise
              * Customer-Centric Delivery
        ================================================================== */}
        <section className="vathilai-about-section" aria-label="About Vathilai Motors">
          <div className="vathilai-section-header">
            <h2 className="vathilai-section-title">About Vathilai Motors</h2>
            <p className="vathilai-section-subtitle">
              Your trusted Yamaha two-wheeler dealership in Batlagundu, offering genuine Yamaha motorcycles, expert assistance and dedicated customer support.
            </p>
          </div>

          <div className="vathilai-pillars-grid">
            <div className="vathilai-pillar-card">
              <div className="vathilai-pillar-icon-box">
                <LucideIcon name="shield-check" />
              </div>
              <h3 className="vathilai-pillar-title">Authorised Sales & Support</h3>
              <p className="vathilai-pillar-text">
                100% genuine Yamaha motorcycles, transparent pricing, and authentic manufacturer warranty documentation.
              </p>
            </div>

            <div className="vathilai-pillar-card">
              <div className="vathilai-pillar-icon-box">
                <LucideIcon name="wrench" />
              </div>
              <h3 className="vathilai-pillar-title">Factory-Certified Expertise</h3>
              <p className="vathilai-pillar-text">
                Technicians certified by Yamaha Motor Co. equipped with computerized diagnostic bays and genuine Yamalube lubricants.
              </p>
            </div>

            <div className="vathilai-pillar-card">
              <div className="vathilai-pillar-icon-box">
                <LucideIcon name="award" />
              </div>
              <h3 className="vathilai-pillar-title">Customer-Centric Delivery</h3>
              <p className="vathilai-pillar-text">
                Priority test-ride scheduling, smooth RTO registration assistance, and dedicated after-sales workshop support.
              </p>
            </div>
          </div>
        </section>

        {/* =================================================================
            SECTION 5 – CONTACT VATHILAI MOTORS
            - Business: Vathilai Motors
            - Phone: 081444 45566
            - Address: Parimalam Theatre Complex, Main Road, Opp. Union Office Madurai, Batlagundu, Dindigul, Tamil Nadu – 624202.
            - Instagram: @vathilaimotors
            - Business Category: Two-Wheeler Dealer.
            - Google Rating: 4.5/5 based on 36 reviews
            - Functional actions: Call Dealership, Get Directions, Instagram
        ================================================================== */}
        <section className="vathilai-contact-section" aria-label="Contact Vathilai Motors">
          <div className="vathilai-section-header">
            <h2 className="vathilai-section-title">Contact Vathilai Motors</h2>
            <p className="vathilai-section-subtitle">
              Visit our authorized Batlagundu showroom or connect with our sales specialists directly.
            </p>
          </div>

          <div className="vathilai-contact-cards-grid">
            {/* Phone Card */}
            <div className="vathilai-contact-card">
              <div className="vathilai-contact-icon-box">
                <LucideIcon name="phone" />
              </div>
              <div className="vathilai-contact-info">
                <span className="vathilai-contact-channel">SHOWROOM DIRECT</span>
                <h4 className="vathilai-contact-val">081444 45566</h4>
                <p className="vathilai-contact-desc">Vathilai Motors — Authorised Yamaha Dealer</p>
              </div>
              <a href={getPhoneHref('081444 45566')} className="vathilai-contact-action-btn">
                Call Dealership
              </a>
            </div>

            {/* Address / Directions Card */}
            <div className="vathilai-contact-card">
              <div className="vathilai-contact-icon-box">
                <LucideIcon name="map-pin" />
              </div>
              <div className="vathilai-contact-info">
                <span className="vathilai-contact-channel">LOCATION & ADDRESS</span>
                <p className="vathilai-contact-address">
                  Parimalam Theatre Complex, Main Road, Opp. Union Office Madurai, Batlagundu, Dindigul, Tamil Nadu – 624202.
                </p>
                <div className="vathilai-rating-pill">
                  <LucideIcon name="star" />
                  <span>Google Rating: 4.5 / 5 (36 reviews)</span>
                </div>
              </div>
              <a
                href={getDirectionsUrl('Parimalam Theatre Complex, Main Road, Opp. Union Office Madurai, Batlagundu, Dindigul, Tamil Nadu – 624202')}
                target="_blank"
                rel="noopener noreferrer"
                className="vathilai-contact-action-btn"
              >
                Get Directions
              </a>
            </div>

            {/* Instagram Card */}
            <div className="vathilai-contact-card">
              <div className="vathilai-contact-icon-box">
                <LucideIcon name="instagram" />
              </div>
              <div className="vathilai-contact-info">
                <span className="vathilai-contact-channel">SOCIAL UPDATES</span>
                <h4 className="vathilai-contact-val">@vathilaimotors</h4>
                <p className="vathilai-contact-desc">Category: Two-Wheeler Dealer · Official Deliveries</p>
              </div>
              <a
                href="https://www.instagram.com/vathilaimotors/"
                target="_blank"
                rel="noopener noreferrer"
                className="vathilai-contact-action-btn"
              >
                Instagram
              </a>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}

export default YamahaBikeDetailsPage;
