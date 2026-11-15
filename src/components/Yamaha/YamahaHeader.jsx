import React, { useEffect, useState } from 'react';

function YamahaHeader({
  variant = 'static',
  route,
  onOverview,
  onDetails,
  onCatalog,
  onBookNow,
  onServices,
  onContact,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  const closeMenuAnd = (action) => {
    setMenuOpen(false);
    action?.();
  };

  const isDetailsActive = route === '/motorcycle-details' || (typeof route === 'string' && route.startsWith('/bike-details'));

  return (
    <header className="yamaha-header">
      <a
        href="/"
        className="yamaha-header__brand"
        aria-label="Vathilai Motors — Authorised Yamaha Dealership"
        onClick={(event) => {
          event.preventDefault();
          closeMenuAnd(onOverview);
        }}
      >
        <div className="yamaha-header__logo-container">
          <img
            src="/imgs/favicon.png"
            alt="Vathilai Motors Logo"
            className="yamaha-header__logo-img"
          />
        </div>
        <div className="yamaha-header__titles">
          <div className="yamaha-header__primary-line">
            <span className="yamaha-header__yamaha-mark">YAMAHA</span>
            <span className="yamaha-header__sep" aria-hidden="true">|</span>
            <span className="yamaha-header__dealership-name">VATHILAI MOTORS</span>
          </div>
          <span className="yamaha-header__tagline">AUTHORISED DEALERSHIP</span>
        </div>
      </a>

      <nav className="yamaha-header__sections" aria-label="Main navigation">
        <button
          className={route === '/' ? 'is-active' : ''}
          type="button"
          aria-current={route === '/' ? 'page' : undefined}
          onClick={() => closeMenuAnd(onOverview)}
        >
          HOME
        </button>
        <button
          className={route === '/bikes' ? 'is-active' : ''}
          type="button"
          aria-current={route === '/bikes' ? 'page' : undefined}
          onClick={() => closeMenuAnd(onCatalog)}
        >
          MOTORCYCLES
        </button>
        <button
          className={isDetailsActive ? 'is-active' : ''}
          type="button"
          aria-current={isDetailsActive ? 'page' : undefined}
          onClick={() => closeMenuAnd(onDetails)}
        >
          DETAILS
        </button>
        <button
          className={route === '/services' ? 'is-active' : ''}
          type="button"
          aria-current={route === '/services' ? 'page' : undefined}
          onClick={() => closeMenuAnd(onServices)}
        >
          SERVICES
        </button>
        <button
          className={`yamaha-header__book-button${route === '/book-now' || route === '/book-us' ? ' is-active' : ''}`}
          type="button"
          onClick={() => closeMenuAnd(onBookNow)}
        >
          BOOK NOW
        </button>
        <button
          className={`yamaha-header__menu-button${menuOpen ? ' is-active' : ''}`}
          type="button"
          aria-expanded={menuOpen}
          aria-controls="yamaha-header-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((isOpen) => !isOpen)}
        >
          MENU
        </button>
      </nav>

      {menuOpen && (
        <nav className="yamaha-header__menu" id="yamaha-header-menu" aria-label="Quick links">
          <button type="button" onClick={() => closeMenuAnd(onOverview)}>HOME</button>
          <button type="button" onClick={() => closeMenuAnd(onCatalog)}>MOTORCYCLES</button>
          <button type="button" onClick={() => closeMenuAnd(onDetails)}>DETAILS</button>
          <button type="button" onClick={() => closeMenuAnd(onServices)}>SERVICES</button>
          <button type="button" onClick={() => closeMenuAnd(onBookNow)}>BOOK NOW</button>
          <button type="button" onClick={() => closeMenuAnd(onContact)}>CONTACT</button>
        </nav>
      )}
    </header>
  );
}

export default YamahaHeader;
