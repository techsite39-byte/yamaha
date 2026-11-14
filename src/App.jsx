import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import YamahaHeader from './components/Yamaha/YamahaHeader.jsx';
import {
  defaultYamahaMotorcycle,
  getYamahaMotorcycle,
  yamahaAllMotorcycles,
} from './components/Yamaha/yamahaMotorcycles.js';
import {
  findMotorcycleByIdOrSlug,
  getCataloguePrice,
  getConfiguratorOptions,
  getMotorcycleSlug,
  getPublishedIndiaBikes,
} from './components/Yamaha/yamahaCatalogueUtils.js';

const YamahaHome = lazy(() => import('./components/Yamaha/YamahaHome.jsx'));
const YamahaServices = lazy(() => import('./components/Yamaha/YamahaServices.jsx'));
const YamahaMotorcycleDetails = lazy(() => import('./components/Yamaha/YamahaMotorcycleDetails.jsx'));
const YamahaBikeCatalog = lazy(() => import('./components/Yamaha/YamahaBikeCatalog.jsx'));
const YamahaBikeDetailsPage = lazy(() => import('./components/Yamaha/YamahaBikeDetailsPage.jsx'));
const YamahaBookingPage = lazy(() => import('./components/Yamaha/YamahaBookingPage.jsx'));
const YamahaAdmin = lazy(() => import('./components/Admin/YamahaAdmin.jsx'));

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

function getCatalogBikeIdFromLocation(motorcycles) {
  const params = new URLSearchParams(window.location.search);
  const bikeParam = params.get('bike') || params.get('slug') || params.get('model');
  const catalog = getPublishedIndiaBikes(motorcycles);
  if (bikeParam) {
    const match = findMotorcycleByIdOrSlug(catalog, bikeParam);
    if (match) return match.id;
    return bikeParam;
  }

  const pathParts = window.location.pathname.split('/').filter(Boolean);
  if (pathParts[0] === 'bike-details' && pathParts[1]) {
    const match = findMotorcycleByIdOrSlug(catalog, pathParts[1]);
    if (match) return match.id;
  }
  return '';
}

function App() {
  const reducedMotion = useReducedMotion();
  const [route, setRoute] = useState(() => window.location.pathname);
  const [motorcycles, setMotorcycles] = useState(yamahaAllMotorcycles);
  const [catalogError, setCatalogError] = useState('');
  const [catalogBikeId, setCatalogBikeId] = useState(() => {
    const bikeId = getCatalogBikeIdFromLocation(yamahaAllMotorcycles);
    if (bikeId) return bikeId;
    return window.location.pathname === '/bike-details'
      ? getPublishedIndiaBikes(yamahaAllMotorcycles)[0]?.id ?? ''
      : '';
  });
  const [bookingVariant, setBookingVariant] = useState(() => new URLSearchParams(window.location.search).get('variant') ?? '');
  const [bookingColor, setBookingColor] = useState(() => new URLSearchParams(window.location.search).get('color') ?? '');
  const [selectedBikeId, setSelectedBikeId] = useState(() => {
    const bikeId = new URLSearchParams(window.location.search).get('bike');
    return bikeId
      ? getYamahaMotorcycle(bikeId).id
      : getYamahaMotorcycle(window.history.state?.selectedBikeId).id;
  });

  useEffect(() => {
    let active = true;
    fetch('/api/public/motorcycles')
      .then((response) => {
        if (!response.ok) throw new Error(`Catalogue request failed with status ${response.status}.`);
        return response.json();
      })
      .then((result) => {
        if (!Array.isArray(result?.motorcycles) || result.motorcycles.length === 0) {
          throw new Error('The server returned an invalid motorcycle catalogue.');
        }
        if (active) {
          setMotorcycles(result.motorcycles);
          setCatalogError('');
        }
      })
      .catch((error) => {
        if (active) setCatalogError(error.message || 'The live catalogue is unavailable.');
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(window.location.pathname);
      const params = new URLSearchParams(window.location.search);
      const bikeId = getCatalogBikeIdFromLocation(motorcycles);
      setCatalogBikeId(bikeId ?? '');
      setBookingVariant(params.get('variant') ?? '');
      setBookingColor(params.get('color') ?? '');
      const selectedId = params.get('bike') ?? window.history.state?.selectedBikeId;
      setSelectedBikeId(selectedId ? getYamahaMotorcycle(selectedId).id : defaultYamahaMotorcycle.id);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [motorcycles]);

  const navigateToDetails = (bikeId) => {
    if (route === '/motorcycle-details') return;
    const motorcycle = getYamahaMotorcycle(bikeId);
    const path = `/motorcycle-details?bike=${encodeURIComponent(motorcycle.id)}`;
    window.history.pushState({
      fromHome: route === '/',
      fromServices: route === '/services',
    }, '', path);
    setSelectedBikeId(motorcycle.id);
    setRoute('/motorcycle-details');
    window.scrollTo(0, 0);
  };

  const navigateToCatalog = () => {
    if (route !== '/bikes') {
      window.history.pushState({ fromRoute: route }, '', '/bikes');
    }
    setRoute('/bikes');
    window.scrollTo(0, 0);
  };

  const navigateToCatalogDetails = (bikeId) => {
    const motorcycle = findMotorcycleByIdOrSlug(getPublishedIndiaBikes(motorcycles), bikeId);
    if (!motorcycle) return;
    const path = `/bike-details/${getMotorcycleSlug(motorcycle)}?bike=${encodeURIComponent(motorcycle.id)}`;
    window.history.pushState({ fromCatalog: route === '/bikes', fromRoute: route }, '', path);
    setCatalogBikeId(motorcycle.id);
    setRoute(`/bike-details/${getMotorcycleSlug(motorcycle)}`);
    window.scrollTo(0, 0);
  };

  const navigateCatalogBike = (bikeId) => {
    const motorcycle = findMotorcycleByIdOrSlug(getPublishedIndiaBikes(motorcycles), bikeId);
    if (!motorcycle) return;
    const slug = getMotorcycleSlug(motorcycle);
    const path = `/bike-details/${slug}?bike=${encodeURIComponent(motorcycle.id)}`;
    window.history.replaceState(window.history.state, '', path);
    setCatalogBikeId(motorcycle.id);
    setBookingVariant('');
    setBookingColor('');
    setRoute(`/bike-details/${slug}`);
    window.scrollTo(0, 0);
  };

  const navigateToBooking = (bikeId, variant = '', color = '', configuration = {}) => {
    const published = getPublishedIndiaBikes(motorcycles);
    const fallbackBike = published[0];
    const motorcycle = findMotorcycleByIdOrSlug(published, bikeId) ?? fallbackBike;
    if (!motorcycle) return;
    const params = new URLSearchParams({ bike: motorcycle.id });
    params.set('slug', getMotorcycleSlug(motorcycle));
    params.set('model', motorcycle.model);
    if (variant) params.set('variant', variant);
    if (color) params.set('color', color);
    const accessories = getConfiguratorOptions(motorcycle, 'accessories');
    const selectedAccessories = Array.isArray(configuration.accessories) ? configuration.accessories : [];
    selectedAccessories.forEach((accessoryId) => {
      if (accessories.some((accessory) => String(accessory.id) === String(accessoryId))) {
        params.append('accessory', String(accessoryId));
      }
    });
    const wheels = getConfiguratorOptions(motorcycle, 'wheels');
    const seats = getConfiguratorOptions(motorcycle, 'seats');
    if (wheels.some((option) => String(option.id) === String(configuration.wheel))) {
      params.set('wheel', String(configuration.wheel));
    }
    if (seats.some((option) => String(option.id) === String(configuration.seat))) {
      params.set('seat', String(configuration.seat));
    }
    const price = getCataloguePrice(motorcycle, 'Chennai', variant);
    if (price) {
      params.set('priceCity', price.city);
      if (Number.isFinite(price.exShowroom)) params.set('exShowroom', String(price.exShowroom));
      if (Number.isFinite(price.onRoad)) params.set('onRoad', String(price.onRoad));
    }
    const targetRoute = route === '/book-now' ? '/book-now' : '/book-us';
    window.history.pushState({ fromRoute: route }, '', `${targetRoute}?${params.toString()}`);
    setCatalogBikeId(motorcycle.id);
    setBookingVariant(variant);
    setBookingColor(color);
    setRoute(targetRoute);
    window.scrollTo(0, 0);
  };

  const navigateBackToCatalog = () => {
    if (window.history.state?.fromCatalog) {
      window.history.back();
      return;
    }
    navigateToCatalog();
  };

  const navigateToHome = (hash = '') => {
    const path = hash ? `/${hash}` : '/';
    if (route === '/') {
      window.history.replaceState(window.history.state, '', path);
    } else {
      window.history.pushState({}, '', path);
    }
    setRoute('/');
    if (hash) {
      requestAnimationFrame(() => {
        document.querySelector(hash)?.scrollIntoView({
          behavior: reducedMotion ? 'auto' : 'smooth',
          block: 'start',
        });
      });
    } else {
      window.scrollTo(0, 0);
    }
  };

  const navigateToServices = () => {
    if (route === '/services') return;
    window.history.pushState({ fromHome: route === '/' }, '', '/services');
    setRoute('/services');
    window.scrollTo(0, 0);
  };

  const handleActiveBikeChange = useCallback((bikeId) => {
    setSelectedBikeId(bikeId);
    if (route === '/') {
      window.history.replaceState(
        { ...window.history.state, selectedBikeId: bikeId },
        '',
        window.location.href,
      );
    }
  }, [route]);

  const navigateBack = () => {
    if (window.history.state?.fromHome || window.history.state?.fromServices) {
      window.history.back();
      return;
    }
    navigateToHome('#yamaha-performance');
  };

  const catalogBikes = getPublishedIndiaBikes(motorcycles);
  const selectedCatalogBike = findMotorcycleByIdOrSlug(catalogBikes, catalogBikeId) ?? catalogBikes[0] ?? null;
  const isCatalogDetailRoute = route === '/bike-details' || route.startsWith('/bike-details/');
  const isBookingRoute = route === '/book-now' || route === '/book-us';

  if (route === '/admin' || route.startsWith('/admin/')) {
    return (
      <Suspense fallback={<main className="yamaha-admin-loading" aria-label="Loading admin portal" />}>
        <YamahaAdmin />
      </Suspense>
    );
  }

  const header = (
    <YamahaHeader
      variant="static"
      route={route}
      onOverview={() => navigateToHome()}
      onDetails={() => navigateToDetails(selectedBikeId)}
      onCatalog={navigateToCatalog}
      onBookNow={() => navigateToBooking(catalogBikeId || getPublishedIndiaBikes(motorcycles)[0]?.id)}
      onServices={navigateToServices}
      onContact={() => navigateToHome('#yamaha-footer')}
    />
  );

  if (route === '/motorcycle-details') {
    const bike = findMotorcycleByIdOrSlug(catalogBikes, selectedBikeId) || getYamahaMotorcycle(selectedBikeId);
    return (
      <>
        {header}
        <Suspense fallback={<main className="yamaha-bike-detail" aria-label="Loading motorcycle details" />}>
          <YamahaBikeDetailsPage
            motorcycle={bike}
            motorcycles={catalogBikes}
            onBack={navigateBack}
            onSelectBike={navigateCatalogBike}
            onBookBike={navigateToBooking}
            onContact={() => navigateToHome('#yamaha-footer')}
          />
        </Suspense>
      </>
    );
  }

  if (route === '/bikes') {
    return (
      <>
        {header}
        <Suspense fallback={<main className="yamaha-bike-catalog" aria-label="Loading motorcycle catalogue" />}>
          <YamahaBikeCatalog
            motorcycles={motorcycles}
            catalogError={catalogError}
            onOpenBike={navigateToCatalogDetails}
            onBookBike={(bikeId) => navigateToBooking(bikeId)}
          />
        </Suspense>
      </>
    );
  }

  if (isCatalogDetailRoute) {
    return (
      <>
        {header}
        <Suspense fallback={<main className="yamaha-bike-detail" aria-label="Loading motorcycle details" />}>
          {selectedCatalogBike ? (
            <YamahaBikeDetailsPage
              motorcycle={selectedCatalogBike}
              motorcycles={catalogBikes}
              key={selectedCatalogBike.id}
              onBack={navigateBackToCatalog}
              onSelectBike={navigateCatalogBike}
              onBookBike={navigateToBooking}
              onContact={() => navigateToHome('#yamaha-footer')}
            />
          ) : (
            <main className="yamaha-bike-not-found">
              <h1>Motorcycle not available</h1>
              <p>This model is no longer listed in the current catalogue.</p>
              <button type="button" onClick={navigateToCatalog}>BROWSE MOTORCYCLES</button>
            </main>
          )}
        </Suspense>
      </>
    );
  }

  if (isBookingRoute) {
    const bookingParams = new URLSearchParams(window.location.search);
    const bikeIdentifier = bookingParams.get('bike') || bookingParams.get('slug') || bookingParams.get('model') || catalogBikeId;
    const initialBookingBike = findMotorcycleByIdOrSlug(catalogBikes, bikeIdentifier) || selectedCatalogBike || catalogBikes[0];
    return (
      <>
        {header}
        <Suspense fallback={<main className="yamaha-booking" aria-label="Loading booking form" />}>
          <YamahaBookingPage
            motorcycles={catalogBikes}
            initialBike={initialBookingBike}
            initialVariant={bookingVariant || bookingParams.get('variant') || ''}
            initialColor={bookingColor || bookingParams.get('color') || ''}
            initialAccessories={bookingParams.getAll('accessory')}
            initialWheelId={bookingParams.get('wheel') ?? ''}
            initialSeatId={bookingParams.get('seat') ?? ''}
            onBack={navigateBackToCatalog}
          />
        </Suspense>
      </>
    );
  }

  if (route === '/services') {
    return (
      <>
        {header}
        <Suspense fallback={<main style={{ height: '100svh', minHeight: 320, background: '#05080f' }} />}>
          <YamahaServices />
        </Suspense>
      </>
    );
  }

  return <>
    {header}
    <Suspense fallback={<main id="top" className="cinematic-stage yamaha-hero" style={{ height: '100svh', minHeight: 640 }} />}>
      <YamahaHome
        reducedMotion={reducedMotion}
        selectedBikeId={selectedBikeId}
        onActiveBikeChange={handleActiveBikeChange}
        onDealerContact={navigateToDetails}
      />
    </Suspense>
  </>;
}

export default App;
