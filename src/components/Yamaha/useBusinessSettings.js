import { useEffect, useState } from 'react';
import { defaultBusinessSettings } from './businessConfig.js';

export function useBusinessSettings() {
  const [business, setBusiness] = useState(defaultBusinessSettings);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    fetch('/api/public/settings')
      .then((response) => {
        if (!response.ok) throw new Error(`Business settings request failed with status ${response.status}.`);
        return response.json();
      })
      .then((result) => {
        if (!result?.settings || typeof result.settings !== 'object') {
          throw new Error('The server returned invalid business settings.');
        }
        if (active) setBusiness({ ...defaultBusinessSettings, ...result.settings });
      })
      .catch((requestError) => {
        console.error('Unable to load current business settings.', requestError);
        if (active) setError('Live dealership details are temporarily unavailable.');
      });

    return () => {
      active = false;
    };
  }, []);

  return { business, error };
}
