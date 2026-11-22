import React, { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getDirectionsUrl, getPhoneHref } from './businessConfig.js';
import { useBusinessSettings } from './useBusinessSettings.js';
import { buildApiUrl } from '../../config/api.js';
import './YamahaFooter.css';

gsap.registerPlugin(ScrollTrigger);

function FooterSocialIcon({ platform, size = 18 }) {
  const p = String(platform || '').toLowerCase();
  if (p.includes('instagram')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    );
  }
  if (p.includes('facebook')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }
  if (p.includes('youtube')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  if (p.includes('x') || p.includes('twitter')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (p.includes('whatsapp')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    );
  }
  if (p.includes('linkedin')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

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
  onLegal,
}) {
  const footerRef = useRef(null);
  const contentRef = useRef(null);
  const { business, error } = useBusinessSettings();
  const [liveSocialProfiles, setLiveSocialProfiles] = useState([]);

  useEffect(() => {
    let active = true;
    fetch(buildApiUrl('/api/public/social-profiles'))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && Array.isArray(data?.profiles)) {
          setLiveSocialProfiles(data.profiles);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const visibleSocialProfiles = useMemo(() => {
    if (liveSocialProfiles.length > 0) return liveSocialProfiles;
    if (Array.isArray(business.socialProfiles) && business.socialProfiles.length > 0) {
      return business.socialProfiles;
    }
    if (business.instagramUrl) {
      return [
        {
          id: 'soc-instagram',
          platform: 'Instagram',
          profileUrl: business.instagramUrl,
          handle: '@vathilaimotors',
          status: 'connected',
        },
      ];
    }
    return [];
  }, [liveSocialProfiles, business.socialProfiles, business.instagramUrl]);

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

  const handleLegalLink = (event, path) => {
    if (onLegal) {
      event.preventDefault();
      onLegal(path);
    }
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
            <picture>
              <source type="image/avif" srcSet="/imgs/favicon-512.avif" />
              <source type="image/webp" srcSet="/imgs/favicon-512.webp" />
              <img
                src="/imgs/favicon-512.png"
                alt="Vathilai Motors Logo"
                className="yamaha-footer__emblem-img"
                width={512}
                height={341}
                loading="lazy"
                decoding="async"
              />
            </picture>
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

          {/* Dynamic Social Media Channels (Brand Column) */}
          {visibleSocialProfiles.length > 0 && (
            <div className="yamaha-footer__social-section" aria-label="Official Social Media Channels">
              <span className="yamaha-footer__social-title">Official Social Channels</span>
              <div className="yamaha-footer__social-icons-row">
                {visibleSocialProfiles.map((p) => {
                  const platformName = p.platform || p.name || 'Social';
                  const link = p.profileUrl || p.url;
                  if (!link || link === '#') return null;
                  const slug = platformName.toLowerCase().replace(/[^a-z0-9]/g, '');
                  return (
                    <a
                      key={p.id || platformName}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`yamaha-footer__social-btn yamaha-footer__social-btn--${slug}`}
                      aria-label={`Follow Vathilai Motors on ${platformName}`}
                      title={`${platformName} (${p.handle || platformName})`}
                    >
                      <FooterSocialIcon platform={platformName} size={18} />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
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
            Business name, address, click-to-call button, directions, Social Channels
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

            {/* Dynamic Social Media Channels (Contact Column) */}
            {visibleSocialProfiles.length > 0 ? (
              <div className="yamaha-footer__contact-socials-block">
                <span className="yamaha-footer__contact-socials-label">Connect Online:</span>
                <div className="yamaha-footer__contact-socials-row">
                  {visibleSocialProfiles.map((p) => {
                    const platformName = p.platform || p.name || 'Social';
                    const link = p.profileUrl || p.url;
                    if (!link || link === '#') return null;
                    const slug = platformName.toLowerCase().replace(/[^a-z0-9]/g, '');
                    return (
                      <a
                        key={p.id || platformName}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`yamaha-footer__contact-social-pill yamaha-footer__contact-social-pill--${slug}`}
                        aria-label={`Follow Vathilai Motors on ${platformName}`}
                        title={`${platformName}: ${p.handle || link}`}
                      >
                        <FooterSocialIcon platform={platformName} size={15} />
                        <span>{platformName}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            ) : (
              business.instagramUrl && (
                <a
                  className="yamaha-footer__action-link"
                  href={business.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow Vathilai Motors on Instagram"
                >
                  <FooterSocialIcon platform="Instagram" size={15} />
                  <span>Follow on Instagram ↗</span>
                </a>
              )
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
          Copyright notice, Privacy Policy, Terms & Conditions, Data Deletion
          ========================================================= */}
      <div className="yamaha-footer__bottom">
        <p className="yamaha-footer__copyright">
          Copyright © {new Date().getFullYear()} {business.dealershipName}. All Rights Reserved.
        </p>
        <nav className="yamaha-footer__legal" aria-label="Legal and Compliance Links">
          <a
            href="/privacy-policy"
            onClick={(event) => handleLegalLink(event, '/privacy-policy')}
            className="yamaha-footer__legal-link"
          >
            Privacy Policy
          </a>
          <span className="yamaha-footer__legal-sep" aria-hidden="true">•</span>
          <a
            href="/terms"
            onClick={(event) => handleLegalLink(event, '/terms')}
            className="yamaha-footer__legal-link"
          >
            Terms &amp; Conditions
          </a>
          <span className="yamaha-footer__legal-sep" aria-hidden="true">•</span>
          <a
            href="/data-deletion"
            onClick={(event) => handleLegalLink(event, '/data-deletion')}
            className="yamaha-footer__legal-link"
          >
            User Data Deletion
          </a>
        </nav>
      </div>
    </footer>
  );
}

export default YamahaFooter;
