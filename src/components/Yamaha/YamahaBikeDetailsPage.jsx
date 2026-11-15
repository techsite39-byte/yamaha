import React, { useEffect, useMemo, useRef, useState } from 'react';
import YamahaBikeImage from './YamahaBikeImage.jsx';
import {
  formatINR,
  getCataloguePrice,
  getMotorcycleSlug,
} from './yamahaCatalogueUtils.js';
import { getDirectionsUrl, getPhoneHref, getWhatsAppHref } from './businessConfig.js';
import { useBusinessSettings } from './useBusinessSettings.js';
import './YamahaBikeDetailsPage.css';

const CONTACT_METHODS = [
  { id: 'call', label: 'Call', icon: 'phone' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp' },
  { id: 'email', label: 'Email', icon: 'mail' },
];

function ContactIcon({ name }) {
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
  return null;
}

function KeySpecIcon({ type }) {
  if (type === 'engine') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    );
  }
  if (type === 'power') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    );
  }
  if (type === 'torque') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
      </svg>
    );
  }
  if (type === 'gear') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    );
  }
  if (type === 'weight') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    );
  }
  if (type === 'tank') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
        <path d="M15 10h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2 2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L20.5 6.5" />
        <path d="M3 11h12" />
      </svg>
    );
  }
  return null;
}

function SpecificationsSection({ motorcycle, activeCategory, onCategoryChange }) {
  const specs = motorcycle.catalogue?.specifications ?? [];
  const sections = ['Engine', 'Dimensions', 'Brakes and tyres', 'Features'];
  const populated = sections.filter((s) => specs.some((row) => row.section === s));

  if (!populated.length) {
    return (
      <div className="yamaha-details__spec-card yamaha-details__spec-card--empty">
        <p>Manufacturer technical specifications are verified directly at the dealership.</p>
      </div>
    );
  }

  const selectedCategory = activeCategory && populated.includes(activeCategory)
    ? activeCategory
    : populated[0];

  return (
    <div className="yamaha-details__specs-container">
      <div className="yamaha-details__specs-tabs" role="tablist" aria-label="Specification categories">
        {populated.map((section) => (
          <button
            key={section}
            type="button"
            role="tab"
            aria-selected={selectedCategory === section}
            className={`yamaha-details__spec-tab-btn ${selectedCategory === section ? 'is-active' : ''}`}
            onClick={() => onCategoryChange?.(section)}
          >
            {section}
          </button>
        ))}
      </div>

      <article className="yamaha-details__spec-card">
        <h4>{selectedCategory}</h4>
        <dl>
          {specs
            .filter((row) => row.section === selectedCategory)
            .map(({ label, value }) => (
              <div key={`${selectedCategory}-${label}`}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
        </dl>
      </article>
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
  const { business: dealership, error: settingsError } = useBusinessSettings();
  const whatsappHref = dealership.whatsappVerified ? getWhatsAppHref(dealership.whatsapp) : '';
  const variants = motorcycle.catalogue?.variants ?? [];
  const colors = motorcycle.catalogue?.colors ?? [];
  const [selectedVariant, setSelectedVariant] = useState(variants[0] ?? '');
  const [activeImage, setActiveImage] = useState(0);
  const [presentationTab, setPresentationTab] = useState('overview');
  const [specCategory, setSpecCategory] = useState('Engine');

  // Enquiry form state
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
  const [reference, setReference] = useState('');
  const submissionId = useRef('');
  const submissionInFlight = useRef(false);
  const enquirySectionRef = useRef(null);

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
      if (event.key === 'ArrowLeft' && currentIndex >= 0 && motorcycles.length > 1) {
        event.preventDefault();
        onSelectBike(motorcycles[(currentIndex - 1 + motorcycles.length) % motorcycles.length].id);
      } else if (event.key === 'ArrowRight' && currentIndex >= 0 && motorcycles.length > 1) {
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

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    submissionId.current = '';
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleEnquirySubmit = async (event) => {
    event.preventDefault();
    if (submissionInFlight.current || reference) return;

    if (!form.name.trim() || form.name.trim().length < 2) {
      setFormError('Please enter your full name (minimum 2 characters).');
      return;
    }

    const cleanPhone = form.phone.replace(/[\s-]/g, '');
    if (!/^(?:\+?91)?[6-9]\d{9}$/.test(cleanPhone)) {
      setFormError('Please enter a valid 10-digit Indian mobile number (e.g. 9841234567).');
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

    if (!CONTACT_METHODS.some((method) => method.label === form.contactMethod)) {
      setFormError('Please select a preferred contact method (Call, WhatsApp, or Email).');
      return;
    }

    submissionInFlight.current = true;
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
          dealership: dealership.dealershipName,
          customer: {
            name: form.name.trim(),
            phone: cleanPhone,
            email: form.email.trim(),
            city: form.city.trim(),
            preferredContactMethod: form.contactMethod,
            dealership: dealership.dealershipName,
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
      submissionInFlight.current = false;
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
      city: '',
      contactMethod: 'Call',
      message: '',
    });
  };

  const activeMotorcycleImage = gallery[activeImage] ?? motorcycle.image;
  const specificationList = motorcycle.catalogue?.specifications ?? [];
  const features = motorcycle.features ?? [];

  // Key technical specifications with automotive SVG icons for Left Panel
  const keySpecs = useMemo(() => {
    const specs = motorcycle.catalogue?.specifications ?? [];
    const findSpec = (keyword) =>
      specs.find((s) => s.label.toLowerCase().includes(keyword.toLowerCase()))?.value;

    return [
      {
        id: 'engine',
        label: 'Displacement',
        value: motorcycle.displacementCc
          ? `${motorcycle.displacementCc} cc`
          : findSpec('displacement') || findSpec('engine') || '—',
        iconType: 'engine',
      },
      {
        id: 'power',
        label: 'Max Power',
        value: findSpec('power') || motorcycle.specs?.power || '—',
        iconType: 'power',
      },
      {
        id: 'torque',
        label: 'Max Torque',
        value: findSpec('torque') || motorcycle.specs?.torque || '—',
        iconType: 'torque',
      },
      {
        id: 'gear',
        label: 'Transmission',
        value: findSpec('transmission') || findSpec('gear') || 'Constant Mesh 6-speed',
        iconType: 'gear',
      },
      {
        id: 'weight',
        label: 'Kerb Weight',
        value: findSpec('weight') || motorcycle.specs?.weight || '—',
        iconType: 'weight',
      },
      {
        id: 'tank',
        label: 'Fuel Tank',
        value: findSpec('fuel') || findSpec('tank') || '—',
        iconType: 'tank',
      },
    ].filter((item) => item.value !== '—');
  }, [motorcycle]);

  return (
    <main className="yamaha-bike-detail">
      {/* ==================================================
          LEFT PANEL — MOTORCYCLE SHOWCASE (48% width)
          Contains ONLY:
          1. Yamaha motorcycle brand label
          2. Selected motorcycle name
          3. Short motorcycle tagline
          4. Large motorcycle image (object-fit: contain)
          5. Gallery thumbnail selector
          6. Overview and Specifications tabs
          7. Short motorcycle description & Key specifications
          8. Vathilai Motors brand introduction
          * ZERO PRICING OR DEALERSHIP CONTACT ON LEFT *
      ================================================== */}
      <section className="yamaha-details__presentation" aria-label={`${motorcycle.model} showcase`}>
        {/* 1. Yamaha Motorcycle Brand Label */}
        <div className="yamaha-details__brand-header">
          <div className="yamaha-details__brand-label">
            <span>VATHILAI MOTORS</span>
            <span className="yamaha-details__brand-dot">·</span>
            <span>YAMAHA MOTORCYCLES</span>
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

        {/* 2. Selected Motorcycle Name */}
        <h1 className="yamaha-details__model-title">{motorcycle.model}</h1>

        {/* 3. Short Motorcycle Tagline */}
        <p className="yamaha-details__tagline">
          {motorcycle.tagline || `${motorcycle.category || 'Sport'} · Performance Engineered for Pure Riding Dynamics`}
        </p>

        {/* 4. Large, High-Quality Motorcycle Image Stage */}
        <div className="yamaha-details__image-stage">
          <YamahaBikeImage
            src={activeMotorcycleImage}
            alt={motorcycle.model}
            className="yamaha-details__motorcycle-image"
            loading="eager"
          />
          <span className="yamaha-details__image-caption">OFFICIAL YAMAHA MOTORCYCLE PHOTOGRAPH</span>

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

        {/* 5. Overview and Specifications Tabs */}
        <div className="yamaha-details__tabs" role="tablist" aria-label="Motorcycle details tabs">
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

        {/* Tab Content */}
        <div className="yamaha-details__tab-panel" role="tabpanel">
          {presentationTab === 'overview' ? (
            <>
              {/* Short Motorcycle Description */}
              <p className="yamaha-details__description">{motorcycle.description}</p>

              {/* Key Technical Specifications with Automotive Icons */}
              {keySpecs.length > 0 && (
                <div className="yamaha-details__key-specs-grid" aria-label="Key technical highlights">
                  {keySpecs.map((spec) => (
                    <div className="yamaha-details__key-spec-item" key={spec.id}>
                      <div className="yamaha-details__key-spec-icon">
                        <KeySpecIcon type={spec.iconType} />
                      </div>
                      <div className="yamaha-details__key-spec-text">
                        <span>{spec.label}</span>
                        <strong>{spec.value}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}

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
                specificationList.slice(0, 8).map(({ label, value }) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))
              ) : (
                <p>Official manufacturer technical specifications are verified directly at the showroom.</p>
              )}
            </div>
          )}
        </div>

        {/* 8. Vathilai Motors Brand Introduction Near the Bottom */}
        <section className="yamaha-details__about-dealership" aria-label="About Vathilai Motors">
          <div className="yamaha-details__about-header">
            <span className="yamaha-details__about-tag">AUTHORISED DEALERSHIP</span>
            <h3 className="yamaha-details__about-title">About Vathilai Motors</h3>
          </div>

          <p className="yamaha-details__about-text">
            {dealership.brandDescription}
          </p>

          <div className="yamaha-details__about-pillars">
            <div className="yamaha-details__about-pillar">
              <span className="yamaha-details__pillar-icon" aria-hidden="true">✓</span>
              <div>
                <strong>Authorised Sales & Support</strong>
                <p>100% genuine Yamaha motorcycles, transparent guidance, and authentic manufacturer warranty documentation.</p>
              </div>
            </div>

            <div className="yamaha-details__about-pillar">
              <span className="yamaha-details__pillar-icon" aria-hidden="true">⚙</span>
              <div>
                <strong>Factory-Certified Expertise</strong>
                <p>Technicians certified by Yamaha Motor Co. equipped with computerized diagnostic bays and genuine Yamalube lubricants.</p>
              </div>
            </div>

            <div className="yamaha-details__about-pillar">
              <span className="yamaha-details__pillar-icon" aria-hidden="true">★</span>
              <div>
                <strong>Customer-Centric Delivery</strong>
                <p>Priority test-ride scheduling, smooth RTO registration assistance, and dedicated after-sales workshop support.</p>
              </div>
            </div>
          </div>
        </section>
      </section>

      {/* ==================================================
          RIGHT PANEL — MOTORCYCLE DETAILS AND ENQUIRY (52% width)
          EXACT REQUIRED SECTION ORDER:
          1. Back to Motorcycles navigation
          2. Configure Your Motorcycle heading
          3. Short YZF-R7 description
          4. Model information card
          5. Key specifications
          6. Contact Our Dealership
          7. Enquire About This Motorcycle form
      ================================================== */}
      <section className="yamaha-details__content" aria-label="Motorcycle configuration and enquiry">
        {/* 1. Back to Motorcycles Navigation */}
        <button type="button" className="yamaha-details__back-link" onClick={onBack}>
          <span aria-hidden="true">←</span> BACK TO MOTORCYCLES
        </button>

        {/* 2. Configure Your Motorcycle Heading */}
        <h2 className="yamaha-details__right-title">Configure Your Motorcycle</h2>

        {/* 3. Short YZF-R7 Description */}
        <p className="yamaha-details__right-subtitle">
          {motorcycle.description || 'Select your factory variant, review verified technical details, and connect directly with our sales team for pricing and availability.'}
        </p>

        {/* 4. Model Information Card */}
        <div className="yamaha-details__summary-card">
          <div className="yamaha-details__summary-meta">
            <span className="yamaha-details__tag">SELECTED MODEL</span>
            <h3>{motorcycle.model}</h3>
            <p>{motorcycle.category} · {motorcycle.catalogue?.category || 'SPORT'}</p>
          </div>

          {variants.length > 1 && (
            <div className="yamaha-details__variant-selector-wrap">
              <span className="yamaha-details__field-label">SELECT VARIANT</span>
              <div className="yamaha-details__variant-pills" role="radiogroup" aria-label="Motorcycle variant">
                {variants.map((v) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={selectedVariant === v}
                    className={`yamaha-details__variant-pill ${selectedVariant === v ? 'is-selected' : ''}`}
                    onClick={() => setSelectedVariant(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div className="yamaha-details__colors-available">
              <span className="yamaha-details__field-label">FACTORY COLOURS</span>
              <div className="yamaha-details__color-tags">
                {colors.map((c) => (
                  <span key={c} className="yamaha-details__color-tag">{c}</span>
                ))}
              </div>
            </div>
          )}

          <div className="yamaha-details__summary-prices">
            <div className="yamaha-details__summary-price-item">
              <span>EX-SHOWROOM · CHENNAI</span>
              <strong>{formatINR(price?.exShowroom)}</strong>
            </div>
            {Number.isFinite(price?.onRoad) && (
              <div className="yamaha-details__summary-price-item yamaha-details__summary-price-item--onroad">
                <span>ESTIMATED ON-ROAD</span>
                <strong>{formatINR(price?.onRoad)}</strong>
              </div>
            )}
          </div>

          <div className="yamaha-details__summary-actions">
            <button
              type="button"
              className="yamaha-details__btn-book-now"
              onClick={() => onBookBike(motorcycle.id, selectedVariant)}
            >
              <span>BOOK THIS MOTORCYCLE</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        {/* 5. Key Specifications */}
        <div className="yamaha-details__config-section">
          <div className="yamaha-details__section-heading">
            <span className="yamaha-details__step-num">01</span>
            <div>
              <h3>Key Specifications</h3>
              <p>Official technical specifications from Yamaha Motor Co.</p>
            </div>
          </div>

          <SpecificationsSection
            motorcycle={motorcycle}
            activeCategory={specCategory}
            onCategoryChange={setSpecCategory}
          />

          {motorcycle.catalogue?.officialSourceUrl && (
            <p className="yamaha-details__source-url">
              <span>Official manufacturer source:</span>{' '}
              <a href={motorcycle.catalogue.officialSourceUrl} target="_blank" rel="noopener noreferrer">
                Yamaha Motor Official Website ↗
              </a>
            </p>
          )}
        </div>

        {/* 6. Dealership contact actions */}
        <section className="yamaha-details__dealership-section" aria-label="Dealership contact information">
          <div className="yamaha-details__section-heading">
            <span className="yamaha-details__step-num">02</span>
            <div>
              <h3>Contact Vathilai Motors</h3>
              <p>{dealership.locality} · {dealership.businessCategory}</p>
            </div>
          </div>

          {settingsError && <p className="yamaha-details__settings-error" role="status">{settingsError}</p>}

          <div className="yamaha-details__contact-cards">
            <article className="yamaha-details__contact-card">
              <div className="yamaha-details__contact-card-icon">
                <ContactIcon name="phone" />
              </div>
              <div className="yamaha-details__contact-card-content">
                <span className="yamaha-details__contact-card-channel">PHONE</span>
                <h4 className="yamaha-details__contact-card-title">Call Dealership</h4>
                <p className="yamaha-details__contact-card-val">
                  <a href={getPhoneHref(dealership.phone)} className="yamaha-details__contact-tel-link">
                    {dealership.phone}
                  </a>
                </p>
                <small className="yamaha-details__contact-card-note">{dealership.dealershipName}</small>
              </div>
              <a href={getPhoneHref(dealership.phone)} className="yamaha-details__contact-card-btn">
                CALL DEALERSHIP
              </a>
            </article>

            <article className="yamaha-details__contact-card yamaha-details__contact-card--location">
              <div className="yamaha-details__contact-card-icon">
                <ContactIcon name="map-pin" />
              </div>
              <div className="yamaha-details__contact-card-content">
                <span className="yamaha-details__contact-card-channel">LOCATION</span>
                <h4 className="yamaha-details__contact-card-title">Get Directions</h4>
                <p className="yamaha-details__contact-card-val">{dealership.address}</p>
                <small className="yamaha-details__contact-card-note">{dealership.postalCode}</small>
              </div>
              <a
                href={getDirectionsUrl(dealership.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="yamaha-details__contact-card-btn yamaha-details__contact-card-btn--location"
              >
                GET DIRECTIONS
              </a>
            </article>

            {whatsappHref && (
              <article className="yamaha-details__contact-card yamaha-details__contact-card--whatsapp">
                <div className="yamaha-details__contact-card-icon">
                  <ContactIcon name="whatsapp" />
                </div>
                <div className="yamaha-details__contact-card-content">
                  <span className="yamaha-details__contact-card-channel">WHATSAPP</span>
                  <h4 className="yamaha-details__contact-card-title">WhatsApp Dealership</h4>
                  <p className="yamaha-details__contact-card-val">{dealership.whatsapp}</p>
                  <small className="yamaha-details__contact-card-note">Verified WhatsApp contact</small>
                </div>
                <a
                  href={`${whatsappHref}?text=${encodeURIComponent(`Hello ${dealership.dealershipName}, I am enquiring about the ${motorcycle.model} (${selectedVariant || 'Standard'}).`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="yamaha-details__contact-card-btn yamaha-details__contact-card-btn--whatsapp"
                >
                  WHATSAPP
                </a>
              </article>
            )}

            {dealership.instagramUrl && (
              <article className="yamaha-details__contact-card">
                <div className="yamaha-details__contact-card-icon">
                  <ContactIcon name="instagram" />
                </div>
                <div className="yamaha-details__contact-card-content">
                  <span className="yamaha-details__contact-card-channel">INSTAGRAM</span>
                  <h4 className="yamaha-details__contact-card-title">Follow Vathilai Motors</h4>
                  <p className="yamaha-details__contact-card-val">@vathilaimotors</p>
                  <small className="yamaha-details__contact-card-note">Dealership updates</small>
                </div>
                <a
                  href={dealership.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="yamaha-details__contact-card-btn"
                >
                  INSTAGRAM
                </a>
              </article>
            )}
          </div>
        </section>

        {/* 7. Enquire About This Motorcycle Form */}
        <section ref={enquirySectionRef} className="yamaha-details__enquiry-section" aria-label="Motorcycle enquiry form">
          <div className="yamaha-details__section-heading">
            <span className="yamaha-details__step-num">03</span>
            <div>
              <h3>Enquire About This Motorcycle</h3>
              <p>Submit your details to receive verified pricing, current availability, and showroom consultation.</p>
            </div>
          </div>

          {reference ? (
            <div className="yamaha-details__enquiry-success" role="alert">
              <div className="yamaha-details__success-icon-wrap" aria-hidden="true">✓</div>
              <span className="yamaha-details__success-eyebrow">CONFIRMATION</span>
              <h3 className="yamaha-details__success-title">ENQUIRY SUBMITTED SUCCESSFULLY</h3>
              <p className="yamaha-details__success-lead">
                Thank you for your interest in Vathilai Motors. Our sales advisor will connect with you shortly.
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
                  <span>City:</span>
                  <strong>{form.city}</strong>
                </div>
                <div className="yamaha-details__success-row">
                  <span>Preferred Contact:</span>
                  <strong>{form.contactMethod}</strong>
                </div>
              </div>

              <div className="yamaha-details__success-dealership-card">
                <h4>DEALERSHIP DETAILS</h4>
                <p><strong>{dealership.dealershipName}</strong></p>
                <p>{dealership.address}</p>
                <p>Phone: <a href={getPhoneHref(dealership.phone)}>{dealership.phone}</a></p>
                {dealership.instagramUrl && (
                  <p><a href={dealership.instagramUrl} target="_blank" rel="noopener noreferrer">Instagram</a></p>
                )}
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

              {/* Auto-identified motorcycle badge */}
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
                    <span>City: <strong>{form.city || 'Enter your city'}</strong></span>
                  </div>
                </div>
              </div>

              {formError && (
                <div className="yamaha-details__form-error" role="alert">
                  <strong>Attention:</strong> {formError}
                </div>
              )}

              <div className="yamaha-details__form-grid">
                <label className="yamaha-details__field yamaha-details__field--full">
                  <span>SELECTED MOTORCYCLE</span>
                  <input
                    type="text"
                    value={`${motorcycle.model} (${selectedVariant || 'Standard'})`}
                    readOnly
                    aria-label="Selected motorcycle"
                  />
                </label>

                <label className="yamaha-details__field">
                  <span>FULL NAME <b aria-hidden="true">*</b></span>
                  <input
                    name="name"
                    type="text"
                    autoComplete="name"
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
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength="15"
                    placeholder="10-digit number e.g. 9841234567"
                    required
                    value={form.phone}
                    onChange={handleFormChange}
                  />
                  <small>10-digit Indian mobile number</small>
                </label>

                <label className="yamaha-details__field">
                  <span>EMAIL ADDRESS <b aria-hidden="true">*</b></span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
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
                        <span className="yamaha-details__chip-icon" aria-hidden="true">
                          <ContactIcon name={m.icon} />
                        </span>
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
                Your enquiry is sent to {dealership.dealershipName} and is available to authorized dealership staff.
              </p>
            </form>
          )}
        </section>
      </section>
    </main>
  );
}

export default YamahaBikeDetailsPage;
