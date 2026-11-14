import React, { useEffect, useMemo, useRef, useState } from 'react';
import YamahaBikeImage from './YamahaBikeImage.jsx';
import {
  findMotorcycleByIdOrSlug,
  formatINR,
  getCataloguePrice,
  getMotorcycleSlug,
} from './yamahaCatalogueUtils.js';
import './YamahaBookingPage.css';

const DEALERSHIPS = [
  'Vathilai Motors — Anna Salai, Chennai',
  'Vathilai Motors — Mount Road Flagship, Chennai',
  'Vathilai Motors — Velachery Service Hub, Chennai',
  'Vathilai Motors — Ambattur Industrial Estate, Chennai',
  'Vathilai Motors — Coimbatore Central',
  'Vathilai Motors — Madurai Bypass',
];

const TIME_SLOTS = [
  '10:00 AM – 12:00 PM (Morning Slot)',
  '12:00 PM – 02:00 PM (Midday Slot)',
  '02:00 PM – 04:00 PM (Afternoon Slot)',
  '04:00 PM – 06:00 PM (Evening Slot)',
];

const INDIAN_STATES = [
  'Tamil Nadu',
  'Karnataka',
  'Kerala',
  'Andhra Pradesh',
  'Telangana',
  'Maharashtra',
  'Puducherry',
];

function getTomorrowDateString() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

const initialForm = {
  name: '',
  phone: '',
  email: '',
  state: 'Tamil Nadu',
  city: 'Chennai',
  dealership: DEALERSHIPS[0],
  appointmentDate: getTomorrowDateString(),
  appointmentTime: TIME_SLOTS[0],
  message: '',
  consent: false,
};

export function resolveSelectedBike(bikes, searchString, fallbackBike = null) {
  if (!Array.isArray(bikes) || bikes.length === 0) return fallbackBike;

  const params = new URLSearchParams(searchString || window.location.search);
  const bikeParam = params.get('bike');
  const slugParam = params.get('slug');
  const modelParam = params.get('model');

  let match = null;
  if (bikeParam) {
    match = findMotorcycleByIdOrSlug(bikes, bikeParam);
  }
  if (!match && slugParam) {
    match = findMotorcycleByIdOrSlug(bikes, slugParam);
  }
  if (!match && modelParam) {
    match = findMotorcycleByIdOrSlug(bikes, modelParam);
  }
  if (match) return match;

  if (fallbackBike?.id) {
    const fallbackMatch = bikes.find((b) => b.id === fallbackBike.id);
    if (fallbackMatch) return fallbackMatch;
  }

  return bikes[0] ?? null;
}

export function syncUrlWithMotorcycle(bike, variant = '') {
  if (!bike) return;
  const price = getCataloguePrice(bike, 'Chennai', variant);
  const params = new URLSearchParams();
  params.set('bike', bike.id);
  params.set('slug', getMotorcycleSlug(bike));
  params.set('model', bike.model);
  if (variant) {
    params.set('variant', variant);
  }
  if (price) {
    params.set('priceCity', 'Chennai');
    if (Number.isFinite(price.exShowroom)) params.set('exShowroom', String(price.exShowroom));
    if (Number.isFinite(price.onRoad)) params.set('onRoad', String(price.onRoad));
  }
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(window.history.state, '', newUrl);
}

function YamahaBookingPage({
  motorcycles = [],
  initialBike = null,
  initialVariant = '',
  onBack,
}) {
  const [form, setForm] = useState(initialForm);

  // 1. Single reliable selectedBikeId state, initialized from URL or verified catalogue
  const [selectedBikeId, setSelectedBikeId] = useState(() => {
    const resolved = resolveSelectedBike(motorcycles, window.location.search, initialBike);
    return resolved?.id ?? '';
  });

  // 2. Resolve motorcycle instance strictly against catalogue
  const motorcycle = useMemo(() => {
    if (!motorcycles.length) return initialBike ?? null;
    return (
      motorcycles.find((bike) => bike.id === selectedBikeId)
      ?? resolveSelectedBike(motorcycles, window.location.search, initialBike)
    );
  }, [motorcycles, selectedBikeId, initialBike]);

  const activeBikeId = motorcycle?.id ?? selectedBikeId;

  const [selectedVariant, setSelectedVariant] = useState(() => {
    return initialVariant || motorcycle?.catalogue?.variants?.[0] || '';
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const submissionId = useRef('');

  // 3. On page load / initialBike / motorcycles update: synchronise selection and URL parameters
  useEffect(() => {
    if (!motorcycles.length) return;
    const resolved = resolveSelectedBike(motorcycles, window.location.search, initialBike);
    if (resolved) {
      if (resolved.id !== selectedBikeId) {
        setSelectedBikeId(resolved.id);
      }
      const variantFromUrl = new URLSearchParams(window.location.search).get('variant');
      const validVariant = variantFromUrl || initialVariant || resolved.catalogue?.variants?.[0] || '';
      setSelectedVariant(validVariant);
      syncUrlWithMotorcycle(resolved, validVariant);
    }
  }, [motorcycles, initialBike]);

  // Synchronise popstate (browser back/forward button)
  useEffect(() => {
    const handlePopState = () => {
      if (!motorcycles.length) return;
      const resolved = resolveSelectedBike(motorcycles, window.location.search, initialBike);
      if (resolved && resolved.id !== selectedBikeId) {
        setSelectedBikeId(resolved.id);
        const variant = new URLSearchParams(window.location.search).get('variant') || resolved.catalogue?.variants?.[0] || '';
        setSelectedVariant(variant);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [motorcycles, selectedBikeId, initialBike]);

  // Ensure selected variant is valid whenever motorcycle changes
  useEffect(() => {
    if (motorcycle?.catalogue?.variants?.length) {
      if (!motorcycle.catalogue.variants.includes(selectedVariant)) {
        const fallbackVariant = motorcycle.catalogue.variants[0];
        setSelectedVariant(fallbackVariant);
        syncUrlWithMotorcycle(motorcycle, fallbackVariant);
      }
    } else {
      setSelectedVariant('');
    }
  }, [motorcycle, selectedVariant]);

  const price = useMemo(() => {
    return motorcycle ? getCataloguePrice(motorcycle, 'Chennai', selectedVariant) : null;
  }, [motorcycle, selectedVariant]);

  const updateForm = (event) => {
    const { name, value, checked, type } = event.target;
    submissionId.current = '';
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  // When customer clicks a bike card
  const handleSelectBike = (bike) => {
    if (!bike) return;
    setSelectedBikeId(bike.id);
    const newVariant = bike.catalogue?.variants?.[0] ?? '';
    setSelectedVariant(newVariant);
    submissionId.current = '';
    setError('');

    // Synchronise all URL parameters cleanly using the genuine motorcycle record
    syncUrlWithMotorcycle(bike, newVariant);
  };

  const handleVariantChange = (event) => {
    const newVariant = event.target.value;
    submissionId.current = '';
    setSelectedVariant(newVariant);
    if (motorcycle) {
      syncUrlWithMotorcycle(motorcycle, newVariant);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!motorcycle) {
      setError('Please select a motorcycle before submitting your booking enquiry.');
      return;
    }

    if (!form.name.trim() || form.name.trim().length < 2) {
      setError('Please enter your full name (minimum 2 characters).');
      return;
    }

    const cleanPhone = form.phone.replace(/[\s-]/g, '');
    if (!/^(?:\+?91)?[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number (e.g., 9840123456).');
      return;
    }

    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!form.city.trim()) {
      setError('Please enter your city.');
      return;
    }

    if (!form.appointmentDate) {
      setError('Please select an appointment date.');
      return;
    }

    if (!form.consent) {
      setError('Please agree to the contact consent checkbox before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (!submissionId.current) {
        submissionId.current = globalThis.crypto?.randomUUID?.()
          ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }

      const response = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: submissionId.current,
          motorcycleId: motorcycle.id,
          variant: selectedVariant,
          appointmentDate: form.appointmentDate,
          appointmentTime: form.appointmentTime,
          dealership: form.dealership,
          customer: {
            name: form.name.trim(),
            phone: cleanPhone,
            email: form.email.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            dealership: form.dealership.trim(),
            appointmentDate: form.appointmentDate,
            appointmentTime: form.appointmentTime,
            message: form.message.trim(),
          },
          consent: true,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.message || result?.error || 'We could not submit your booking request. Please try again.');
      }
      if (typeof result?.reference !== 'string' || !result.reference.trim()) {
        throw new Error('The server did not return a valid booking reference. Please contact the dealership.');
      }
      setReference(result.reference);
    } catch (requestError) {
      setError(requestError.message || 'We could not submit your booking request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookAnother = () => {
    setReference('');
    submissionId.current = '';
    setError('');
    setForm(initialForm);
  };

  // SUCCESS CONFIRMATION STATE
  if (reference) {
    return (
      <main className="yamaha-booking yamaha-booking--success">
        <div className="yamaha-booking__success-container">
          <div className="yamaha-booking__success-icon" aria-hidden="true">✓</div>
          <p className="yamaha-booking__eyebrow">BOOKING ENQUIRY CONFIRMED</p>
          <h1>Thank you, {form.name.trim() || 'Rider'}. We’ll be in touch!</h1>
          <p className="yamaha-booking__success-message">
            Your booking request for the <strong>{motorcycle?.model ?? 'Yamaha Motorcycle'}</strong> has been verified and registered directly with Vathilai Motors.
          </p>

          <div className="yamaha-booking__reference-box">
            <span>OFFICIAL BOOKING REFERENCE</span>
            <strong>{reference}</strong>
          </div>

          <div className="yamaha-booking__confirmation-details">
            <dl>
              <div><dt>Model & Variant</dt><dd>{motorcycle?.model} ({selectedVariant || 'Standard'})</dd></div>
              <div><dt>Indicative Ex-Showroom</dt><dd>{formatINR(price?.exShowroom)}</dd></div>
              <div><dt>Estimated On-Road (Chennai)</dt><dd>{formatINR(price?.onRoad)}</dd></div>
              <div><dt>Dealership</dt><dd>{form.dealership}</dd></div>
              <div><dt>Appointment Date</dt><dd>{form.appointmentDate}</dd></div>
              <div><dt>Preferred Time Slot</dt><dd>{form.appointmentTime}</dd></div>
              <div><dt>Contact Mobile</dt><dd>{form.phone}</dd></div>
              <div><dt>Email Address</dt><dd>{form.email}</dd></div>
            </dl>
          </div>

          <p className="yamaha-booking__no-payment">
            <strong>Important Notice:</strong> No payment has been taken online. This submission reserves your showroom appointment and priority consultation with our Yamaha sales advisors.
          </p>

          <div className="yamaha-booking__success-actions">
            <button type="button" className="yamaha-booking__btn-primary" onClick={handleBookAnother}>
              BOOK ANOTHER MOTORCYCLE
            </button>
            <button type="button" className="yamaha-booking__btn-secondary" onClick={onBack}>
              BACK TO MOTORCYCLES
            </button>
            <a href="tel:+919840123456" className="yamaha-booking__btn-call">
              CALL DEALERSHIP: +91 98401 23456
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="yamaha-booking">
      {/* SECTION A — HERO (Clean Navbar Clearance & Spacing) */}
      <section className="yamaha-booking__hero" aria-label="Booking hero">
        <div className="yamaha-booking__hero-overlay" />
        <div className="yamaha-booking__hero-content">
          <p className="yamaha-booking__eyebrow">VATHILAI MOTORS · OFFICIAL YAMAHA DEALERSHIP</p>
          <h1>BOOK YOUR DREAM YAMAHA</h1>
          <p className="yamaha-booking__hero-sub">
            Choose your motorcycle and submit an enquiry to our dealership. Experience transparent pricing, verified specifications, and priority showroom delivery.
          </p>
        </div>
        <div className="yamaha-booking__hero-visual">
          <img
            src="/imgs/Yamaha%20R15M.webp"
            alt="Yamaha flagship motorcycle"
            className="yamaha-booking__hero-bike"
          />
        </div>
      </section>

      <div className="yamaha-booking__main-container">
        {/* SECTION B — SELECT YOUR MOTORCYCLE */}
        <section className="yamaha-booking__section" aria-labelledby="motorcycle-select-title">
          <div className="yamaha-booking__section-header">
            <span className="yamaha-booking__step-indicator">01</span>
            <div>
              <h2 id="motorcycle-select-title">Select Your Motorcycle</h2>
              <p>Choose your model from our verified Yamaha India range below.</p>
            </div>
          </div>

          <div className="yamaha-booking__bike-grid">
            {motorcycles.map((bike) => {
              const isSelected = bike.id === activeBikeId;
              const bikePrice = getCataloguePrice(bike, 'Chennai', bike.catalogue?.variants?.[0]);
              const displayVariant = bike.catalogue?.variants?.[0] || 'Standard';

              return (
                <article
                  key={bike.id}
                  className={`yamaha-booking__bike-card${isSelected ? ' is-selected' : ''}`}
                  onClick={() => handleSelectBike(bike)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectBike(bike);
                    }
                  }}
                  aria-pressed={isSelected}
                >
                  {/* Small SELECTED label */}
                  {isSelected && (
                    <span className="yamaha-booking__card-badge">
                      <span className="yamaha-booking__badge-icon" aria-hidden="true">✓</span>
                      SELECTED
                    </span>
                  )}
                  <div className="yamaha-booking__bike-card-img">
                    <YamahaBikeImage src={bike.image} alt={bike.model} />
                  </div>
                  <div className="yamaha-booking__bike-card-body">
                    <span className="yamaha-booking__bike-card-tag">{bike.category}</span>
                    <h3>{bike.model}</h3>
                    <p className="yamaha-booking__bike-card-variant">Variant: {displayVariant}</p>
                    <p className="yamaha-booking__bike-card-desc">{bike.description}</p>
                    <div className="yamaha-booking__bike-card-price">
                      <span>Ex-Showroom from</span>
                      <strong>{formatINR(bikePrice?.exShowroom)}</strong>
                    </div>
                    <button
                      type="button"
                      className={`yamaha-booking__bike-select-btn${isSelected ? ' is-active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectBike(bike);
                      }}
                    >
                      {isSelected ? (
                        <>
                          <span className="yamaha-booking__btn-check" aria-hidden="true">✓</span>
                          <span>SELECTED</span>
                        </>
                      ) : (
                        <span>SELECT BIKE</span>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* FORM & STICKY SUMMARY LAYOUT */}
        <div className="yamaha-booking__form-layout">
          <form className="yamaha-booking__form" onSubmit={handleSubmit} noValidate>
            {/* SECTION C — CUSTOMER INFORMATION */}
            <section className="yamaha-booking__section" aria-labelledby="customer-details-title">
              <div className="yamaha-booking__section-header">
                <span className="yamaha-booking__step-indicator">02</span>
                <div>
                  <h2 id="customer-details-title">Customer Information</h2>
                  <p>Provide your contact details so our dealership team can schedule your appointment.</p>
                </div>
              </div>

              <div className="yamaha-booking__form-grid">
                <label className="yamaha-booking__field">
                  <span>FULL NAME <b aria-hidden="true">*</b></span>
                  <input
                    name="name"
                    type="text"
                    autoComplete="name"
                    maxLength="100"
                    placeholder="Enter your full name"
                    required
                    value={form.name}
                    onChange={updateForm}
                  />
                </label>

                <label className="yamaha-booking__field">
                  <span>MOBILE NUMBER <b aria-hidden="true">*</b></span>
                  <input
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="10-digit number e.g. 9840123456"
                    maxLength="15"
                    required
                    value={form.phone}
                    onChange={updateForm}
                  />
                  <small>10-digit Indian mobile number</small>
                </label>

                <label className="yamaha-booking__field">
                  <span>EMAIL ADDRESS <b aria-hidden="true">*</b></span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength="254"
                    placeholder="name@example.com"
                    required
                    value={form.email}
                    onChange={updateForm}
                  />
                </label>

                <label className="yamaha-booking__field">
                  <span>STATE <b aria-hidden="true">*</b></span>
                  <select name="state" value={form.state} onChange={updateForm} required>
                    {INDIAN_STATES.map((state) => (
                      <option value={state} key={state}>{state}</option>
                    ))}
                  </select>
                </label>

                <label className="yamaha-booking__field">
                  <span>CITY <b aria-hidden="true">*</b></span>
                  <input
                    name="city"
                    type="text"
                    autoComplete="address-level2"
                    maxLength="80"
                    placeholder="Your City"
                    required
                    value={form.city}
                    onChange={updateForm}
                  />
                </label>

                <label className="yamaha-booking__field">
                  <span>PREFERRED DEALERSHIP <b aria-hidden="true">*</b></span>
                  <select name="dealership" value={form.dealership} onChange={updateForm} required>
                    {DEALERSHIPS.map((dealer) => (
                      <option value={dealer} key={dealer}>{dealer}</option>
                    ))}
                  </select>
                </label>

                {motorcycle && motorcycle.catalogue?.variants?.length > 1 && (
                  <label className="yamaha-booking__field">
                    <span>SELECTED VARIANT <b aria-hidden="true">*</b></span>
                    <select
                      value={selectedVariant}
                      onChange={handleVariantChange}
                    >
                      {motorcycle.catalogue.variants.map((v) => (
                        <option value={v} key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="yamaha-booking__field">
                  <span>PREFERRED APPOINTMENT DATE <b aria-hidden="true">*</b></span>
                  <input
                    name="appointmentDate"
                    type="date"
                    min={getTomorrowDateString()}
                    required
                    value={form.appointmentDate}
                    onChange={updateForm}
                  />
                  <small>Schedule your showroom visit</small>
                </label>

                <label className="yamaha-booking__field">
                  <span>PREFERRED TIME SLOT <b aria-hidden="true">*</b></span>
                  <select name="appointmentTime" value={form.appointmentTime} onChange={updateForm} required>
                    {TIME_SLOTS.map((slot) => (
                      <option value={slot} key={slot}>{slot}</option>
                    ))}
                  </select>
                </label>

                <label className="yamaha-booking__field yamaha-booking__field--full">
                  <span>ADDITIONAL MESSAGE (OPTIONAL)</span>
                  <textarea
                    name="message"
                    rows="3"
                    maxLength="1000"
                    placeholder="Tell us about your test ride preferences, exchange enquiry, or specific questions."
                    value={form.message}
                    onChange={updateForm}
                  />
                </label>
              </div>
            </section>

            {/* CONSENT CHECKBOX */}
            <label className="yamaha-booking__consent-label">
              <input
                name="consent"
                type="checkbox"
                checked={form.consent}
                onChange={updateForm}
                required
              />
              <span>
                I agree that Vathilai Motors and its authorised sales advisors may contact me regarding this booking enquiry, test ride scheduling, and availability updates. <b aria-hidden="true">*</b>
              </span>
            </label>

            {error && (
              <div className="yamaha-booking__error-banner" role="alert">
                <strong>Attention:</strong> {error}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <div className="yamaha-booking__submit-container">
              <button
                className="yamaha-booking__submit-btn"
                type="submit"
                disabled={submitting || !motorcycle}
              >
                {submitting ? (
                  <span>SUBMITTING ENQUIRY…</span>
                ) : (
                  <>
                    <span>SUBMIT BOOKING ENQUIRY</span>
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
              <p className="yamaha-booking__submit-note">
                No credit card or online payment required. Your information is securely submitted to Vathilai Motors.
              </p>
            </div>
          </form>

          {/* SECTION D — BOOKING SUMMARY ASIDE (STICKY ON DESKTOP) */}
          <aside className="yamaha-booking__summary-card" aria-label="Booking summary">
            <h3 className="yamaha-booking__summary-title">BOOKING SUMMARY</h3>

            {motorcycle ? (
              <>
                <div className="yamaha-booking__summary-image-wrap">
                  <YamahaBikeImage
                    src={motorcycle.image}
                    alt={motorcycle.model}
                    className="yamaha-booking__summary-bike-img"
                  />
                </div>

                <div className="yamaha-booking__summary-details">
                  <h4>{motorcycle.model}</h4>
                  <p className="yamaha-booking__summary-sub">
                    {motorcycle.category} · {motorcycle.catalogue?.category || 'SPORT'}
                  </p>

                  <dl className="yamaha-booking__summary-list">
                    <div>
                      <dt>Selected Model</dt>
                      <dd><strong>{motorcycle.model}</strong></dd>
                    </div>
                    <div>
                      <dt>Variant</dt>
                      <dd>{selectedVariant || 'Standard'}</dd>
                    </div>
                    <div className="yamaha-booking__summary-price-line">
                      <dt>Ex-Showroom Price</dt>
                      <dd><strong>{formatINR(price?.exShowroom)}</strong></dd>
                    </div>
                    {Number.isFinite(price?.onRoad) && (
                      <div className="yamaha-booking__summary-onroad">
                        <dt>Estimated On-Road (Chennai)</dt>
                        <dd><strong>{formatINR(price?.onRoad)}</strong></dd>
                      </div>
                    )}
                  </dl>

                  <div className="yamaha-booking__appointment-summary">
                    <h5>Showroom Visit Preferences</h5>
                    <p><strong>Dealership:</strong> {form.dealership}</p>
                    <p><strong>Date:</strong> {form.appointmentDate}</p>
                    <p><strong>Slot:</strong> {form.appointmentTime}</p>
                    {form.name && <p><strong>Customer:</strong> {form.name}</p>}
                    {form.phone && <p><strong>Mobile:</strong> {form.phone}</p>}
                  </div>

                  <p className="yamaha-booking__summary-note">
                    Ex-showroom and on-road prices are indicative figures. Final pricing, documentation, and on-road registration/insurance are confirmed at the dealership.
                  </p>
                </div>
              </>
            ) : (
              <div className="yamaha-booking__empty-selection">
                <p>Please select a motorcycle from the list above to view your booking summary.</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

export default YamahaBookingPage;
