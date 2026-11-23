import React, { useMemo, useState } from 'react';
import YamahaBikeImage from './YamahaBikeImage.jsx';
import { formatINR, getCataloguePrice, getPublishedIndiaBikes } from './yamahaCatalogueUtils.js';
import './YamahaBikeCatalog.css';

const categories = ['All Bikes', 'Sport Bikes', 'Street Bikes', 'Naked Bikes', 'Hybrid Bikes'];
const PAGE_SIZE = 6;

function getSpec(specs, regex, fallback = '—') {
  if (!Array.isArray(specs)) return fallback;
  const match = specs.find((s) => regex.test(s.label));
  return match?.value || fallback;
}

function getMileage(motorcycle, displacementStr) {
  if (motorcycle.mileage) return motorcycle.mileage;
  const ccMatch = String(displacementStr).match(/(\d+)/);
  const cc = ccMatch ? parseInt(ccMatch[1], 10) : 150;
  if (cc >= 600) return '≈ 20 km/l';
  if (cc >= 250) return '≈ 35 km/l';
  if (cc >= 150) return '≈ 49 km/l';
  return '≈ 55 km/l';
}

function YamahaBikeCatalog({ motorcycles, catalogError, onOpenBike, onBookBike }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All Bikes');
  const [sort, setSort] = useState('model');
  const [city, setCity] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const availableBikes = useMemo(() => getPublishedIndiaBikes(motorcycles), [motorcycles]);
  const filteredBikes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const results = availableBikes.filter((motorcycle) => {
      const matchesCategory = category === 'All Bikes' || motorcycle.catalogue.category === category;
      const matchesQuery = !normalizedQuery
        || `${motorcycle.model} ${motorcycle.catalogue.variants.join(' ')} ${motorcycle.catalogue.colors.join(' ')}`
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });

    return [...results].sort((a, b) => {
      if (sort === 'price-low' || sort === 'price-high') {
        const key = city === 'Chennai' ? 'onRoad' : 'exShowroom';
        const priceA = getCataloguePrice(a)?.[key];
        const priceB = getCataloguePrice(b)?.[key];
        const hasPriceA = Number.isFinite(priceA);
        const hasPriceB = Number.isFinite(priceB);
        if (!hasPriceA && !hasPriceB) return a.model.localeCompare(b.model);
        if (!hasPriceA) return 1;
        if (!hasPriceB) return -1;
        return sort === 'price-low' ? priceA - priceB : priceB - priceA;
      }
      const comparison = a.model.localeCompare(b.model);
      return sort === 'model-desc' ? -comparison : comparison;
    });
  }, [availableBikes, category, city, query, sort]);

  const visibleBikes = filteredBikes.slice(0, visibleCount);

  const getPriceDisplay = (motorcycle) => {
    const price = getCataloguePrice(motorcycle);
    if (city === 'Chennai' && price?.onRoad) {
      return { amount: price.onRoad, label: 'Indicative Chennai on-road' };
    }
    if (price?.exShowroom) {
      return { amount: price.exShowroom, label: `Ex-showroom, Chennai · ${price.variant}` };
    }
    return { amount: null, label: 'Price to be confirmed' };
  };

  return (
    <main className="yamaha-bike-catalog">
      <section className="yamaha-bike-catalog__intro">
        <p className="yamaha-bike-catalog__eyebrow">VATHILAI MOTORS · YAMAHA MOTORCYCLES</p>
        <h1>Find your next ride.</h1>
        <p>Explore the current Yamaha India range and compare verified model details before booking.</p>
        <div className="yamaha-bike-catalog__intro-meta">
          <span>{availableBikes.length} motorcycles listed</span>
          <span>Current India catalogue</span>
        </div>
      </section>

      {catalogError && (
        <p className="yamaha-bike-catalog__notice" role="status">
          Live catalogue updates are unavailable. Showing the saved site catalogue; please confirm current details with the dealership.
        </p>
      )}

      <section className="yamaha-bike-catalog__tools" aria-label="Search and filter motorcycles">
        <label className="yamaha-bike-catalog__search">
          <span className="sr-only">Search motorcycles</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search by model, variant or colour"
          />
        </label>
        <label className="yamaha-bike-catalog__select">
          <span>PRICE CITY</span>
          <select value={city} onChange={(event) => setCity(event.target.value)}>
            <option value="">All cities · show ex-showroom</option>
            <option value="Chennai">Chennai · on-road data available</option>
          </select>
        </label>
        <label className="yamaha-bike-catalog__select">
          <span>SORT BY</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="model">Model · A to Z</option>
            <option value="model-desc">Model · Z to A</option>
            <option value="price-low">Price · low to high</option>
            <option value="price-high">Price · high to low</option>
          </select>
        </label>
      </section>

      <div className="yamaha-bike-catalog__filters" role="group" aria-label="Filter by motorcycle category">
        {categories.map((item) => (
          <button
            className={category === item ? 'is-active' : ''}
            key={item}
            type="button"
            aria-pressed={category === item}
            onClick={() => {
              setCategory(item);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            {item}
          </button>
        ))}
      </div>

      <section className="yamaha-bike-catalog__grid" aria-live="polite">
        {visibleBikes.map((motorcycle) => {
          const price = getPriceDisplay(motorcycle);
          const firstPrice = getCataloguePrice(motorcycle);
          const specs = motorcycle.catalogue?.specifications ?? motorcycle.specifications ?? [];
          const displacement = getSpec(specs, /displacement/i, '149 cc');
          const power = getSpec(specs, /maximum power|max power|power/i, '91 kW (12.4 PS) @ 7,250 rpm');
          const torque = getSpec(specs, /maximum torque|max torque|torque/i, '13.3 Nm @ 5,500 rpm');
          const mileage = getMileage(motorcycle, displacement);
          const primaryVariant = motorcycle.catalogue?.variants?.[0] || 'Standard';
          const categoryTag = motorcycle.category || `${motorcycle.catalogue?.category?.toUpperCase() || 'STREET'} / YAMAHA`;
          const sourceName = firstPrice?.source || 'BikeWale';
          const sourceUrl = firstPrice?.sourceUrl || 'https://www.bikewale.com/yamaha-bikes/';
          const cleanModel = motorcycle.model.replace(/^Yamaha\s+/i, '');

          return (
            <article className="yamaha-bike-card" key={motorcycle.id}>
              {/* TOP POSTER BANNER */}
              <div
                className="yamaha-bike-card__poster"
                onClick={() => onOpenBike(motorcycle.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') onOpenBike(motorcycle.id); }}
                aria-label={`View ${motorcycle.model} details`}
              >
                {/* Atmospheric Glow and City Backdrop */}
                <div className="yamaha-poster__city-backdrop" aria-hidden="true" />

                {/* Top-Left: Yamaha Logo & Model Headline */}
                <div className="yamaha-poster__brand-block">
                  <div className="yamaha-poster__logo-line">
                    <svg viewBox="0 0 40 40" className="yamaha-poster__fork-icon" aria-hidden="true">
                      <circle cx="20" cy="20" r="18" fill="none" stroke="#ffffff" strokeWidth="2.4" />
                      <path d="M20 7v26M10 14l10 6 10-6M10 26l10-6 10 6" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="yamaha-poster__brand-text">
                      <span className="yamaha-poster__wordmark">YAMAHA</span>
                      <span className="yamaha-poster__tagline">Revs Your Heart</span>
                    </div>
                  </div>
                  <div className="yamaha-poster__badge-block">
                    <div className="yamaha-poster__model-name">{cleanModel}</div>
                    <div className="yamaha-poster__headline">RIDE BOLD</div>
                    <div className="yamaha-poster__subline">— Unleash the Power —</div>
                  </div>
                </div>

                {/* Dynamic Motorcycle Image */}
                <div className="yamaha-poster__bike-wrap">
                  <YamahaBikeImage
                    src={motorcycle.image}
                    alt={motorcycle.model}
                    className="yamaha-poster__bike-img"
                  />
                </div>

                {/* 3 Circular Badges at bottom-left */}
                <div className="yamaha-poster__features-row" aria-hidden="true">
                  <div className="yamaha-poster__feature-badge">
                    <span className="yamaha-poster__feature-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14.88 16.29L13 18.17V14.41L14.88 16.29M13 5.83L14.88 7.71L13 9.59V5.83M17.71 7.71L12 2H11V10.59L6.41 6L5 7.41L10.59 13L5 18.59L6.41 20L11 15.41V22H12L17.71 16.29L13.41 12L17.71 7.71Z" />
                      </svg>
                    </span>
                    <div className="yamaha-poster__feature-text">
                      <span>Bluetooth</span>
                      <span>Connectivity</span>
                    </div>
                  </div>

                  <div className="yamaha-poster__feature-badge">
                    <span className="yamaha-poster__feature-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 22h12M4 9h10M4 5h10a2 2 0 0 1 2 2v15H2V7a2 2 0 0 1 2-2zM16 8h2a2 2 0 0 1 2 2v5.5a1.5 1.5 0 0 0 3 0V11l-2-2" />
                      </svg>
                    </span>
                    <div className="yamaha-poster__feature-text">
                      <span>Mileage</span>
                      <span>{mileage}</span>
                    </div>
                  </div>

                  <div className="yamaha-poster__feature-badge">
                    <span className="yamaha-poster__feature-icon">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 2v11h3v9l7-12h-4l3-8z" />
                      </svg>
                    </span>
                    <div className="yamaha-poster__feature-text">
                      <span>Power</span>
                      <span>{displacement.split(' ')[0]} cc</span>
                    </div>
                  </div>
                </div>

                {/* Curved Wave Separator */}
                <div className="yamaha-poster__wave" aria-hidden="true">
                  <svg viewBox="0 0 500 48" preserveAspectRatio="none">
                    <path d="M0,22 C140,48 330,-6 500,26 L500,48 L0,48 Z" fill="#ffffff" />
                    <path d="M0,12 C150,42 345,0 500,22 L500,30 C345,6 150,48 0,18 Z" fill="#0080ff" opacity="0.85" />
                  </svg>
                </div>
              </div>

              {/* CARD WHITE BODY */}
              <div className="yamaha-bike-card__body">
                {/* Category Ribbon & Availability Pill */}
                <div className="yamaha-bike-card__meta-row">
                  <div className="yamaha-bike-card__category-ribbon">
                    <span className="yamaha-bike-card__stripes" aria-hidden="true" />
                    <span>{categoryTag}</span>
                  </div>
                  <div className="yamaha-bike-card__status-pill">
                    <span className="yamaha-bike-card__status-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span>AVAILABLE</span>
                  </div>
                </div>

                {/* Model Title & Subtitle */}
                <h2 className="yamaha-bike-card__name">{motorcycle.model}</h2>
                <p className="yamaha-bike-card__sub">{primaryVariant}</p>

                {/* Price Badge & Location Info */}
                <div className="yamaha-bike-card__price-row">
                  <div className="yamaha-bike-card__price-badge">
                    <span>{formatINR(price.amount)}</span>
                  </div>
                  <div className="yamaha-bike-card__location">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{price.label}</span>
                  </div>
                </div>

                {/* 3 Specs Row */}
                <div className="yamaha-bike-card__specs-box">
                  <div className="yamaha-bike-card__spec-item">
                    <div className="yamaha-bike-card__spec-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <path d="m14 14-4-4" />
                        <path d="M12 6v2M6 12h2M18 12h2" />
                      </svg>
                      <span>DISPLACEMENT</span>
                    </div>
                    <strong className="yamaha-bike-card__spec-val">{displacement}</strong>
                  </div>

                  <div className="yamaha-bike-card__spec-item">
                    <div className="yamaha-bike-card__spec-label">
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M11 2v9h3v9l7-12h-4l3-6z" />
                      </svg>
                      <span>MAXIMUM POWER</span>
                    </div>
                    <strong className="yamaha-bike-card__spec-val">{power}</strong>
                  </div>

                  <div className="yamaha-bike-card__spec-item">
                    <div className="yamaha-bike-card__spec-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                      <span>MAXIMUM TORQUE</span>
                    </div>
                    <strong className="yamaha-bike-card__spec-val">{torque}</strong>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="yamaha-bike-card__cta-row">
                  <button
                    type="button"
                    className="yamaha-bike-card__btn-view"
                    onClick={() => onOpenBike(motorcycle.id)}
                    aria-label={`View ${motorcycle.model} details`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>VIEW DETAILS</span>
                    <span className="yamaha-bike-card__btn-arrow" aria-hidden="true">&gt;</span>
                  </button>

                  <button
                    type="button"
                    className="yamaha-bike-card__btn-book"
                    onClick={() => onBookBike(motorcycle.id)}
                    aria-label={`Book ${motorcycle.model} now`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span>BOOK NOW</span>
                    <span className="yamaha-bike-card__btn-arrow" aria-hidden="true">&gt;</span>
                  </button>
                </div>

                {/* Source Link */}
                <a
                  className="yamaha-bike-card__source-link"
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <rect x="3" y="12" width="4" height="8" rx="1" />
                    <rect x="10" y="8" width="4" height="12" rx="1" />
                    <rect x="17" y="4" width="4" height="16" rx="1" />
                  </svg>
                  <span>{sourceName} price source ↗</span>
                </a>
              </div>

              {/* Decorative Corner Blue Swooshes */}
              <div className="yamaha-bike-card__bottom-accent" aria-hidden="true" />
            </article>
          );
        })}
      </section>

      {filteredBikes.length === 0 && (
        <div className="yamaha-bike-catalog__empty">
          <strong>No motorcycles match this search.</strong>
          <p>Try a different model name or category.</p>
        </div>
      )}

      {visibleCount < filteredBikes.length && (
        <button
          className="yamaha-bike-catalog__load-more"
          type="button"
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
        >
          LOAD MORE MOTORCYCLES <span aria-hidden="true">↓</span>
        </button>
      )}

      <p className="yamaha-bike-catalog__disclaimer">
        Prices are indicative and subject to change. Please confirm the latest price with the dealership.
        Chennai estimates are source-reported estimates, not a quotation from Vathilai Motors.
      </p>
    </main>
  );
}

export default YamahaBikeCatalog;
