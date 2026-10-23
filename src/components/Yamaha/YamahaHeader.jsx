import React, { useState } from 'react';

const sections = ['MODEL OVERVIEW', 'DETAILS', 'MENU'];

function YamahaHeader({ variant, reducedMotion }) {
  const [activeSection, setActiveSection] = useState(sections[0]);

  const scrollTo = (selector) => {
    document.querySelector(selector)?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <header className={`yamaha-header yamaha-header--${variant}`}>
      <a href="#top" className="yamaha-header__wordmark" aria-label="Yamaha home">
        YAMAHA<span>®</span>
      </a>

      {variant === 'transparent' ? (
        <nav className="yamaha-header__primary" aria-label="Main navigation">
          <button type="button" onClick={() => scrollTo('#yamaha-performance')}>BIKES</button>
          <button type="button" onClick={() => scrollTo('.yamaha-section06')}>DISCOVER</button>
          <button type="button" onClick={() => scrollTo('#yamaha-footer')}>CONTACT</button>
        </nav>
      ) : (
        <nav className="yamaha-header__sections" aria-label="Yamaha section navigation">
          {sections.map((section) => (
            <button
              className={activeSection === section ? 'is-active' : ''}
              key={section}
              type="button"
              aria-pressed={activeSection === section}
              onClick={() => setActiveSection(section)}
            >
              {section}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}

export default YamahaHeader;
