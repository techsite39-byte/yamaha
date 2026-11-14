export function formatINR(amount) {
  if (!Number.isFinite(amount) || amount <= 0) return 'Price on request';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getCataloguePrice(motorcycle, city = 'Chennai', variant) {
  const prices = motorcycle?.catalogue?.prices ?? [];
  if (variant) {
    return prices.find((price) => price.variant === variant && price.city === city) ?? null;
  }
  return prices.find((price) => price.city === city) ?? null;
}

export function getMotorcycleSlug(motorcycle) {
  return motorcycle?.model
    ?.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') ?? '';
}

export function getConfiguratorOptions(motorcycle, group) {
  const options = motorcycle?.catalogue?.configurator?.[group];
  if (!Array.isArray(options)) return [];
  return options.filter((option) => (
    option
    && (typeof option.id === 'string' || typeof option.id === 'number')
    && String(option.id).trim()
    && typeof (option.name ?? option.label) === 'string'
    && String(option.name ?? option.label).trim()
  ));
}

export function getColorForVariant(variant, colors = []) {
  const normalizedVariant = variant?.trim().toLowerCase() ?? '';
  return colors.find((color) => normalizedVariant.endsWith(color.toLowerCase())) ?? '';
}

export function getVariantForColor(color, variants = []) {
  const normalizedColor = color?.trim().toLowerCase() ?? '';
  if (!normalizedColor) return '';
  return variants.find((variant) => variant.trim().toLowerCase().endsWith(normalizedColor)) ?? '';
}

export function getPublishedIndiaBikes(motorcycles) {
  return (motorcycles ?? []).filter((motorcycle) => (
    motorcycle.catalogue?.market === 'IN'
    && motorcycle.catalogue.published
    && motorcycle.catalogue.available
  ));
}

export function findMotorcycleByIdOrSlug(bikes, identifier) {
  if (!identifier || !Array.isArray(bikes) || bikes.length === 0) return null;
  const target = String(identifier).trim().toLowerCase();
  // 1. Exact ID match
  let found = bikes.find((bike) => String(bike.id).toLowerCase() === target);
  if (found) return found;
  // 2. Slug match
  found = bikes.find((bike) => getMotorcycleSlug(bike).toLowerCase() === target);
  if (found) return found;
  // 3. Model name match
  found = bikes.find((bike) => String(bike.model).toLowerCase() === target);
  if (found) return found;
  // 4. Normalized match without 'yamaha-' prefix
  const strippedTarget = target.replace(/^yamaha-?/, '');
  found = bikes.find((bike) => {
    const s = getMotorcycleSlug(bike).toLowerCase().replace(/^yamaha-?/, '');
    const id = String(bike.id).toLowerCase().replace(/^yamaha-?/, '');
    return s === strippedTarget || id === strippedTarget;
  });
  return found ?? null;
}
