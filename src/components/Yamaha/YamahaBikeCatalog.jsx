import React, { useMemo, useState } from 'react';
import YamahaBikeImage from './YamahaBikeImage.jsx';
import { formatINR, getCataloguePrice, getPublishedIndiaBikes } from './yamahaCatalogueUtils.js';
import './YamahaBikeCatalog.css';

const categories = ['All Bikes', 'Sport Bikes', 'Street Bikes', 'Naked Bikes', 'Hybrid Bikes'];
const PAGE_SIZE = 6;

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
          return (
            <article className="yamaha-bike-card" key={motorcycle.id}>
              <button
                className="yamaha-bike-card__image-button"
                type="button"
                onClick={() => onOpenBike(motorcycle.id)}
                aria-label={`View ${motorcycle.model} details`}
              >
                <YamahaBikeImage
                  src={motorcycle.image}
                  alt={motorcycle.model}
                  className="yamaha-bike-card__image"
                />
                <span className="yamaha-bike-card__category">{motorcycle.catalogue.category}</span>
              </button>
              <div className="yamaha-bike-card__content">
                <div className="yamaha-bike-card__title-row">
                  <div>
                    <p className="yamaha-bike-card__series">{motorcycle.category}</p>
                    <h2>{motorcycle.model}</h2>
                  </div>
                  <span className="yamaha-bike-card__status">AVAILABLE</span>
                </div>
                <p className="yamaha-bike-card__variant">
                  {motorcycle.catalogue.variants.join(' · ')}
                </p>
                <div className="yamaha-bike-card__price">
                  <span>{price.label}</span>
                  <strong>{formatINR(price.amount)}</strong>
                </div>
                <div className="yamaha-bike-card__specs">
                  {(motorcycle.catalogue.specifications ?? [])
                    .filter(({ section }) => section === 'Engine')
                    .slice(0, 3)
                    .map(({ label, value }) => (
                      <span key={label}><small>{label}</small>{value}</span>
                    ))}
                </div>
                {firstPrice && (
                  <a
                    className="yamaha-bike-card__source"
                    href={firstPrice.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {firstPrice.source} price source ↗
                  </a>
                )}
                <div className="yamaha-bike-card__actions">
                  <button type="button" className="yamaha-bike-card__details" onClick={() => onOpenBike(motorcycle.id)}>
                    VIEW DETAILS <span aria-hidden="true">↗</span>
                  </button>
                  <button type="button" className="yamaha-bike-card__book" onClick={() => onBookBike(motorcycle.id)}>
                    BOOK NOW
                  </button>
                </div>
              </div>
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
