import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './YamahaFooter.css';

gsap.registerPlugin(ScrollTrigger);

const links = [
  { label: 'Home', href: '#top' },
  { label: 'Motorcycles', href: '#yamaha-performance' },
  { label: 'Accessories', href: '#yamaha-performance' },
  { label: 'About Yamaha', href: '#yamaha-footer', selector: '.yamaha-section04' },
  { label: 'Contact', href: '#yamaha-footer' },
];

function YamahaFooter() {
  const footerRef = useRef(null);
  const contentRef = useRef(null);

  const handleLinkClick = (event, selector) => {
    if (!selector) return;
    const destination = document.querySelector(selector);
    if (!destination) return;
    event.preventDefault();
    destination.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  useEffect(() => {
    const context = gsap.context(() => {
      const columns = contentRef.current
        ? Array.from(contentRef.current.children)
        : [];

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(columns, { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.fromTo(columns, { autoAlpha: 0, y: 12 }, {
        autoAlpha: 1,
        y: 0,
        duration: 0.52,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top 88%',
          toggleActions: 'play none none reverse',
        },
      });
    }, footerRef);

    return () => context.revert();
  }, []);

  return (
    <footer ref={footerRef} id="yamaha-footer" className="yamaha-footer" aria-label="Yamaha footer">
      <div className="yamaha-footer__inner" ref={contentRef}>
        <section className="yamaha-footer__brand" aria-label="Yamaha brand">
          <a className="yamaha-footer__logo" href="#top" aria-label="Yamaha home">
            <svg className="yamaha-footer__emblem" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <circle cx="24" cy="24" r="21" />
              <path d="M13 9.5 24 28 35 9.5M13 9.5v13.4c0 6.9 4.8 11.6 11 11.6s11-4.7 11-11.6V9.5M24 28V7.5" />
              <path d="M9.5 18.5h29" />
            </svg>
            <span>YAMAHA</span>
          </a>
          <p className="yamaha-footer__tagline">Revs Your Heart.</p>
          <div className="yamaha-footer__socials" role="group" aria-label="Yamaha social media">
            <a className="yamaha-footer__social" href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Open Instagram">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle className="yamaha-footer__social-dot" cx="17.6" cy="6.8" r="1" />
              </svg>
            </a>
            <a className="yamaha-footer__social" href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Open Facebook">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M14.2 20v-7.3h2.5l.4-3h-2.9V7.8c0-.9.3-1.5 1.5-1.5h1.6V3.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.2v2.1H8.2v3h2.7V20" />
              </svg>
            </a>
            <a className="yamaha-footer__social" href="https://www.youtube.com/" target="_blank" rel="noreferrer" aria-label="Open YouTube">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M21 7.2a2.4 2.4 0 0 0-1.7-1.7C17.8 5.1 12 5.1 12 5.1s-5.8 0-7.3.4A2.4 2.4 0 0 0 3 7.2 25 25 0 0 0 2.6 12 25 25 0 0 0 3 16.8a2.4 2.4 0 0 0 1.7 1.7c1.5.4 7.3.4 7.3.4s5.8 0 7.3-.4a2.4 2.4 0 0 0 1.7-1.7 25 25 0 0 0 .4-4.8 25 25 0 0 0-.4-4.8Z" />
                <path d="m10 15.1 5-3.1-5-3.1v6.2Z" />
              </svg>
            </a>
          </div>
        </section>

        <nav className="yamaha-footer__column" aria-label="Quick links">
          <h2>Quick Links</h2>
          <ul>
            {links.map(({ label, href, selector }) => (
              <li key={label}><a href={href} onClick={(event) => handleLinkClick(event, selector)}>{label}</a></li>
            ))}
          </ul>
        </nav>

        <section className="yamaha-footer__column" aria-labelledby="yamaha-footer-visit">
          <h2 id="yamaha-footer-visit">Visit Us</h2>
          <address>
            <strong>Yamaha Showroom</strong>
            <span>Your showroom address</span>
            <span>Your city, state, PIN code</span>
            <a href="mailto:your@email.com">your@email.com</a>
          </address>
        </section>

        <section className="yamaha-footer__column yamaha-footer__hours" aria-labelledby="yamaha-footer-hours">
          <h2 id="yamaha-footer-hours">Opening Hours</h2>
          <dl>
            <div><dt>Mon – Fri</dt><dd>9:00 AM – 8:00 PM</dd></div>
            <div><dt>Sat</dt><dd>9:00 AM – 8:00 PM</dd></div>
            <div><dt>Sun</dt><dd>10:00 AM – 6:00 PM</dd></div>
          </dl>
        </section>
      </div>
    </footer>
  );
}

export default YamahaFooter;
