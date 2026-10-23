import React, { useState } from 'react';
import './YamahaMotorcycleDetails.css';

const categories = [
  { id: 'wheels', label: 'Wheels', icon: 'wheel' },
  { id: 'body', label: 'Body Color', icon: 'body' },
  { id: 'seat', label: 'Seat', icon: 'seat' },
  { id: 'accessories', label: 'Accessories', icon: 'accessories' },
  { id: 'specifications', label: 'Specifications', icon: 'specifications' },
];

const wheelOptions = [
  { name: 'Default', color: '#0069b4' },
  { name: 'Dark Blue', color: '#17233d' },
  { name: 'Racing Blue', color: '#1684e8' },
  { name: 'Light Grey', color: '#c6cedc' },
];

function CategoryIcon({ name }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  if (name === 'wheel') {
    return <svg {...common}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2.2" /><path d="M12 4v5.8m0 4.4V20m8-8h-5.8m-4.4 0H4m13.7-5.7-4.1 4.1m-3.2 3.2-4.1 4.1m11.4 0-4.1-4.1m-3.2-3.2L6.3 6.3" /></svg>;
  }
  if (name === 'body') {
    return <svg {...common}><path d="M3 14.5 6.5 12l3-4h5l3 3 3.5 1.5-1 3h-4l-2-2H9l-2 2H4z" /><circle cx="7" cy="17" r="1.5" /><circle cx="17" cy="17" r="1.5" /></svg>;
  }
  if (name === 'seat') {
    return <svg {...common}><path d="M5 14h13l2 3H7a3 3 0 0 1-2-3Z" /><path d="m8 14 2-6h5l3 6M7 17l-1 2m12-2 1 2" /></svg>;
  }
  if (name === 'accessories') {
    return <svg {...common}><path d="m14 4 6 6-9 9-6-6z" /><path d="m12 6 6 6M5 14l-2 2 5 5 2-2" /></svg>;
  }
  return <svg {...common}><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2" fill="currentColor" /><circle cx="15" cy="12" r="2" fill="currentColor" /><circle cx="11" cy="18" r="2" fill="currentColor" /></svg>;
}

function YamahaMotorcycleDetails({ motorcycle, onBack }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeCategory, setActiveCategory] = useState('wheels');
  const [selectedWheel, setSelectedWheel] = useState('Default');

  const selectedCategory = categories.find(({ id }) => id === activeCategory);

  const renderConfiguration = () => {
    if (activeCategory === 'wheels') {
      return (
        <>
          <div className="yamaha-details-wheel-options" role="group" aria-label="Wheel color preference">
            {wheelOptions.map(({ name, color }) => (
              <button
                className="yamaha-details-wheel-option"
                type="button"
                key={name}
                aria-pressed={selectedWheel === name}
                onClick={() => setSelectedWheel(name)}
              >
                <span
                  className="yamaha-details-wheel-swatch"
                  style={{ '--swatch-color': color }}
                  aria-hidden="true"
                />
                <span className="yamaha-details-wheel-name">{name}</span>
              </button>
            ))}
          </div>
          <p className="yamaha-details-note">
            Color preference only; the motorcycle image is unchanged.
          </p>
        </>
      );
    }

    if (activeCategory === 'specifications') {
      return (
        <dl className="yamaha-details-spec-list">
          {motorcycle.specifications.map((specification, index) => (
            <div key={`${index}-${specification}`}>
              <dt>{motorcycle.features[index]?.title ?? `DETAIL ${index + 1}`}</dt>
              <dd>{specification}</dd>
            </div>
          ))}
        </dl>
      );
    }

    const unavailable = {
      body: 'Alternate body-color images are not available for this motorcycle.',
      seat: 'Seat options are not included in the available motorcycle data.',
      accessories: 'Accessory options are not included in the available motorcycle data.',
    };

    return (
      <div className="yamaha-details-unavailable">
        <span aria-hidden="true">—</span>
        <p>{unavailable[activeCategory]}</p>
      </div>
    );
  };

  return (
    <main className="yamaha-details-page">
      <section className="yamaha-details-showcase" aria-label={`Yamaha ${motorcycle.model}`}>
        <div className="yamaha-details-brand">
          <span>YAMAHA</span>
        </div>

        <div className="yamaha-details-model">
          <h1>{motorcycle.model}</h1>
          <div className="yamaha-details-tabs" role="tablist" aria-label="Motorcycle information">
            <button
              id="yamaha-details-tab-overview"
              className={activeTab === 'overview' ? 'is-active' : ''}
              type="button"
              role="tab"
              aria-selected={activeTab === 'overview'}
              aria-controls="yamaha-details-tab-panel"
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              id="yamaha-details-tab-specs"
              className={activeTab === 'specs' ? 'is-active' : ''}
              type="button"
              role="tab"
              aria-selected={activeTab === 'specs'}
              aria-controls="yamaha-details-tab-panel"
              onClick={() => setActiveTab('specs')}
            >
              Specs
            </button>
          </div>
          <div
            className="yamaha-details-tab-panel"
            id="yamaha-details-tab-panel"
            role="tabpanel"
            aria-labelledby={`yamaha-details-tab-${activeTab}`}
          >
            {activeTab === 'overview'
              ? <p>{motorcycle.description}</p>
              : <p>{motorcycle.specifications.slice(0, 2).join(' · ')}</p>}
          </div>
        </div>

        <div className="yamaha-details-image">
          <img
            src={motorcycle.image}
            alt={`Yamaha ${motorcycle.model}`}
            loading="eager"
            decoding="async"
          />
        </div>

        <div className="yamaha-details-purchase">
          <div className="yamaha-details-price">
            <span>PRICE</span>
            <strong>Price on request</strong>
          </div>
          <div className="yamaha-details-cart-wrap">
            <button
              className="yamaha-details-cart"
              type="button"
              disabled
              title="Cart functionality is not available on this site."
            >
              <span aria-hidden="true">+</span>
              Add to Cart
            </button>
            <small>Cart unavailable</small>
          </div>
        </div>
      </section>

      <section className="yamaha-details-config" aria-label="Motorcycle configuration">
        <div className="yamaha-details-utilities" aria-hidden="true">
          <span>YAMAHA MOTORCYCLES</span>
        </div>

        <button className="yamaha-details-back" type="button" onClick={onBack}>
          <span aria-hidden="true">←</span>
          Back
        </button>

        <h2>Configure Your Yamaha</h2>

        <nav className="yamaha-details-categories" aria-label="Configuration categories">
          {categories.map(({ id, label, icon }) => (
            <button
              className={activeCategory === id ? 'is-active' : ''}
              type="button"
              key={id}
              aria-pressed={activeCategory === id}
              onClick={() => setActiveCategory(id)}
            >
              <span className="yamaha-details-category-icon"><CategoryIcon name={icon} /></span>
              <span className="yamaha-details-category-label">{label}</span>
            </button>
          ))}
        </nav>

        <div className="yamaha-details-config-content" aria-live="polite">
          <h3>{selectedCategory?.label}</h3>
          {renderConfiguration()}
        </div>

        <div className="yamaha-details-config-footer">
          <span>{motorcycle.category}</span>
          <span>{motorcycle.model}</span>
        </div>
      </section>
    </main>
  );
}

export default YamahaMotorcycleDetails;
