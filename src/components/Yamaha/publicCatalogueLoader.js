import { buildApiUrl } from '../../config/api.js';
import {
  replaceYamahaMotorcycles,
  yamahaAllMotorcycles,
} from './yamahaMotorcycles.js';
import { yamahaIndiaCatalog } from './yamahaIndiaCatalog.js';

let catalogueLoadPromise = null;

export function loadPublicMotorcycles() {
  if (catalogueLoadPromise) return catalogueLoadPromise;

  const fallbackMotorcycles = [...yamahaAllMotorcycles];
  catalogueLoadPromise = (async () => {
    try {
      const response = await fetch(buildApiUrl('/api/public/motorcycles'), { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Catalogue request failed with status ${response.status}.`);
      }

      const result = await response.json();
      if (!Array.isArray(result?.motorcycles) || result.motorcycles.length === 0) {
        throw new Error('The server returned an invalid motorcycle catalogue.');
      }

      const liveMotorcycles = result.motorcycles;
      replaceYamahaMotorcycles(liveMotorcycles);
      return { source: 'live', motorcycles: liveMotorcycles };
    } catch (error) {
      console.warn('Using the bundled motorcycle catalog because the server catalog is unavailable.', error);
      const safeFallback = fallbackMotorcycles.length
        ? fallbackMotorcycles
        : [...yamahaIndiaCatalog];
      return { source: 'fallback', motorcycles: safeFallback, error };
    }
  })();

  return catalogueLoadPromise;
}
