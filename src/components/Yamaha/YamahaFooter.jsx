import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getDirectionsUrl, getPhoneHref } from './businessConfig.js';
import { useBusinessSettings } from './useBusinessSettings.js';
import './YamahaFooter.css';

gsap.registerPlugin(ScrollTrigger);

const links = [
  { label: 'Home', href: '/', action: 'home' },
  { label: 'Motorcycles', href: '/bikes', action: 'catalog' },
  { label: 'Motorcycle Details', href: '/motorcycle-details', action: 'details' },
  { label: 'Services', href: '/services', action: 'services' },
  { label: 'Book Now', href: '/book-us', action: 'book' },
  { label: 'Contact Us', href: '#yamaha-footer', action: 'contact' },
];

function YamahaFooter({
  selectedBikeId,
  onHome,
  onCatalog,
  onDetails,
  onServices,
  onBookNow,
  onContact,
}) {
  const footerRef = useRef(null);
  const contentRef = useRef(null);
  const { business, error } = useBusinessSettings();

  const rating = Number(business.googleRating) || 4.5;
  const reviewCount = Number(business.googleReviewCount) || 36;

  const actions = {
    home: onHome,
    catalog: onCatalog,
    details: onDetails,
    services: onServices,
    book: onBookNow,
    contact: onContact,
  };

  useEffect(() => {
    const context = gsap.context(() => {
      const columns = contentRef.current ? Array.from(contentRef.current.children) : [];
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(columns, { autoAlpha: 1, y: 0 });
        return;
      }
      gsap.fromTo(
        columns,
        { autoAlpha: 0, y: 16 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 92%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, footerRef);

    return () => context.revert();
  }, []);

  const handleQuickLink = (event, action) => {
    const navigate = actions[action];
    if (!navigate) return;
    event.preventDefault();
    navigate();
  };

  return (
    <footer ref={footerRef} id="yamaha-footer" className="yamaha-footer" aria-label="Vathilai Motors footer">
      <div className="yamaha-footer__inner" ref={contentRef}>
        {/* =========================================================
            SECTION 1: BRAND SECTION
            Yamaha / Vathilai Motors branding with verified description
            ========================================================= */}
        <section className="yamaha-footer__column yamaha-footer__brand" aria-label="Yamaha and Vathilai Motors">
          <a className="yamaha-footer__logo" href="/" onClick={(event) => handleQuickLink(event, 'home')}>
            <img
              src="/imgs/favicon.png"
              alt="Vathilai Motors Logo"
              className="yamaha-footer__emblem-img"
            />
            <div className="yamaha-footer__brand-titles">
              <span className="yamaha-footer__yamaha-wordmark">YAMAHA</span>
              <span className="yamaha-footer__brand-sub">REVS YOUR HEART</span>
            </div>
          </a>

          <div className="yamaha-footer__dealership-badge">
            <h2 className="yamaha-footer__dealership-name">{business.dealershipName || 'Vathilai Motors'}</h2>
            <span className="yamaha-footer__authorised-tag">Authorised Yamaha Dealership</span>
          </div>

          <p className="yamaha-footer__description">
            Your trusted Yamaha two-wheeler dealership in Batlagundu, offering genuine Yamaha motorcycles, expert assistance and dedicated customer support.
          </p>
        </section>

        {/* =========================================================
            SECTION 2: QUICK LINKS
            All links navigate to existing routes
            ========================================================= */}
        <nav className="yamaha-footer__column yamaha-footer__quick-links" aria-label="Quick links">
          <h2 className="yamaha-footer__col-heading">Quick Links</h2>
          <ul className="yamaha-footer__links-list">
            {links.map(({ label, href, action }) => (
              <li key={action}>
                <a
                  href={action === 'book' && selectedBikeId ? `${href}?bike=${encodeURIComponent(selectedBikeId)}` : href}
                  onClick={(event) => handleQuickLink(event, action)}
                  className="yamaha-footer__link"
                >
                  <span className="yamaha-footer__link-chevron" aria-hidden="true">›</span>
                  <span>{label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* =========================================================
            SECTION 3: CONTACT INFORMATION
            Business name, address, click-to-call button, directions, Instagram
            No fake email or WhatsApp number.
            ========================================================= */}
        <section className="yamaha-footer__column yamaha-footer__contact" aria-labelledby="yamaha-footer-contact">
          <h2 id="yamaha-footer-contact" className="yamaha-footer__col-heading">Contact Information</h2>
          {error && <p className="yamaha-footer__notice" role="status">{error}</p>}

          <address className="yamaha-footer__address-block">
            <strong className="yamaha-footer__contact-business">{business.dealershipName}</strong>
            <p className="yamaha-footer__address-text">
              <svg className="yamaha-footer__inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{business.address}</span>
            </p>

            {/* Click-to-call button using tel:08144445566 */}
            <a
              className="yamaha-footer__call-btn"
              href={getPhoneHref(business.phone)}
              aria-label={`Call Vathilai Motors at ${business.phone}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>Call {business.phone}</span>
            </a>

            {/* Google Maps directions link */}
            <a
              className="yamaha-footer__action-link"
              href={getDirectionsUrl(business.address)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Get Google Maps directions to Vathilai Motors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
              <span>Get Directions on Google Maps ↗</span>
            </a>

            {/* Instagram link */}
            {business.instagramUrl && (
              <a
                className="yamaha-footer__action-link"
                href={business.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow Vathilai Motors on Instagram"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" />
                </svg>
                <span>Follow on Instagram ↗</span>
              </a>
            )}
          </address>
        </section>

        {/* =========================================================
            SECTION 4: BUSINESS INFORMATION
            Two-Wheeler Dealer, Batlagundu, Dindigul, Tamil Nadu - 624202,
            Google Review Rating 4.5/5 from 36 reviews
            ========================================================= */}
        <section className="yamaha-footer__column yamaha-footer__business-info" aria-labelledby="yamaha-footer-business">
          <h2 id="yamaha-footer-business" className="yamaha-footer__col-heading">Business Information</h2>

          <div className="yamaha-footer__business-details">
            <div className="yamaha-footer__detail-item">
              <span className="yamaha-footer__detail-label">BUSINESS CATEGORY</span>
              <strong className="yamaha-footer__detail-val">{business.businessCategory || 'Two-Wheeler Dealer'}</strong>
            </div>

            <div className="yamaha-footer__detail-item">
              <span className="yamaha-footer__detail-label">LOCATION</span>
              <strong className="yamaha-footer__detail-val">Batlagundu, Dindigul, Tamil Nadu – 624202</strong>
            </div>
          </div>

          {/* Google Review Rating: 4.5 / 5 based on 36 Google reviews */}
          <div
            className="yamaha-footer__google-badge"
            aria-label={`Google Review Rating: ${rating.toFixed(1)} out of 5 based on ${reviewCount} Google reviews`}
          >
            <div className="yamaha-footer__google-head">
              <svg className="yamaha-footer__google-g-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              <span className="yamaha-footer__google-title">Google Reviews</span>
            </div>

            <div className="yamaha-footer__google-score-row">
              <span className="yamaha-footer__google-score">{rating.toFixed(1)}</span>
              <div className="yamaha-footer__google-stars" aria-hidden="true">
                <span className="yamaha-footer__star is-filled">★</span>
                <span className="yamaha-footer__star is-filled">★</span>
                <span className="yamaha-footer__star is-filled">★</span>
                <span className="yamaha-footer__star is-filled">★</span>
                <span className="yamaha-footer__star is-half">★</span>
              </div>
              <span className="yamaha-footer__google-total">/ 5</span>
            </div>

            <p className="yamaha-footer__google-attribution">
              Based on {reviewCount} Google reviews
            </p>
          </div>
        </section>
      </div>

      {/* =========================================================
          FOOTER BOTTOM BAR
          Copyright notice, Privacy Policy, Terms & Conditions
          ========================================================= */}
      <div className="yamaha-footer__bottom">
        <p className="yamaha-footer__copyright">
          Copyright © {new Date().getFullYear()} {business.dealershipName}. All Rights Reserved.
        </p>
        <div className="yamaha-footer__legal">
          <details className="yamaha-footer__legal-item">
            <summary>Privacy Policy</summary>
            <p>
              Customer contact information submitted through this website is exclusively handled by {business.dealershipName} to respond to motorcycle enquiries and booking requests. No personal details are sold or shared with unauthorized third parties.
            </p>
          </details>
          <details className="yamaha-footer__legal-item">
            <summary>Terms &amp; Conditions</summary>
            <p>
              Motorcycle specifications, ex-showroom and on-road prices, colour schemes, and availability are subject to official manufacturer revisions and final confirmation at the {business.dealershipName} showroom.
            </p>
          </details>
        </div>
      </div>
    </footer>
  );
}

export default YamahaFooter;
