import React from 'react';
import { defaultYamahaMotorcycle, getYamahaMotorcycle } from './yamahaMotorcycles.js';
import './YamahaJourneyHero.css';

const tickerMessages = [
  'GENUINE YAMAHA PARTS',
  'ENGINEERED FOR PERFORMANCE',
  'BUILT AROUND THE RIDER',
  'DISCOVER YAMAHA',
  'PRECISION IN EVERY DETAIL',
  'RIDE WITH CONFIDENCE',
];

function YamahaJourneyHero({ selectedBikeId = defaultYamahaMotorcycle.id }) {
  const motorcycle = getYamahaMotorcycle(selectedBikeId);
  const detailMotorcycle = getYamahaMotorcycle('yzf-r7');

  return (
    <section className="yamaha-journey" aria-label="Built for every journey">
      <div className="yamaha-journey__main">
        <div className="yamaha-journey__shell">
          <div className="yamaha-journey__visual" aria-label={`Yamaha ${motorcycle.model}`}>
            <div className="yamaha-journey__bike-wrap">
              <img className="yamaha-journey__bike" src={motorcycle.image} alt={`Yamaha ${motorcycle.model}`} loading="lazy" decoding="async" />
            </div>
            <div className="yamaha-journey__detail-panel" aria-hidden="true">
              <img src={detailMotorcycle.image} alt="" loading="lazy" decoding="async" />
            </div>
            <span className="yamaha-journey__image-model">{motorcycle.model}</span>
          </div>

          <div className="yamaha-journey__content">
            <p className="yamaha-journey__eyebrow">BUILT FOR EVERY JOURNEY</p>
            <h2>Engineered for<br />Performance.<br />Designed for You.</h2>
            <div className="yamaha-journey__divider" aria-hidden="true"><span /></div>

            <div className="yamaha-journey__features">
              <article className="yamaha-journey__feature">
                <span className="yamaha-journey__feature-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 3 20 6v5.5c0 4.5-3 7.7-8 9.5-5-1.8-8-5-8-9.5V6l8-3Z" />
                    <path d="m8.5 12 2.2 2.2 4.8-5" />
                  </svg>
                </span>
                <span className="yamaha-journey__feature-copy">
                  <strong>Genuine Yamaha Quality</strong>
                  <small>Built with precision. Made for every ride.</small>
                </span>
              </article>
              <article className="yamaha-journey__feature">
                <span className="yamaha-journey__feature-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M14.5 6.2a5 5 0 0 0-6.7 6.7L3 17.7 6.3 21l4.8-4.8a5 5 0 0 0 6.7-6.7l-3.2 3.2-3.3-3.3 3.2-3.2Z" />
                    <path d="m5.4 18.6 1 1" />
                  </svg>
                </span>
                <span className="yamaha-journey__feature-copy">
                  <strong>Service You Can Trust</strong>
                  <small>Expert care and support for your journey.</small>
                </span>
              </article>
            </div>

            <div className="yamaha-journey__stats" aria-label="Rider community highlights">
              <div><strong>500+</strong><span>HAPPY RIDERS</span></div>
              <div><strong>50+</strong><span>SERVICE LOCATIONS</span></div>
              <div><strong>4.8<span className="yamaha-journey__star">★</span></strong><span>RIDER RATING</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="yamaha-journey__blue-angle" aria-hidden="true" />
      <div className="yamaha-journey__ticker" aria-label="Yamaha promotional messages">
        <div className="yamaha-journey__ticker-track" aria-hidden="true">
          {[...tickerMessages, ...tickerMessages].map((message, index) => (
            <span className="yamaha-journey__ticker-item" key={`${message}-${index}`}>
              {message}<i />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default YamahaJourneyHero;
