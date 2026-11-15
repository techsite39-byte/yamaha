export const defaultBusinessSettings = Object.freeze({
  dealershipName: 'Vathilai Motors',
  tagline: 'Authorised Yamaha Dealer & Certified Service',
  brandDescription: 'Your trusted Yamaha two-wheeler dealership in Batlagundu, offering genuine Yamaha motorcycles, expert assistance and dedicated customer support.',
  phone: '081444 45566',
  email: '',
  whatsapp: '',
  whatsappVerified: false,
  address: 'Parimalam Theatre Complex, Main Road, Opp. Union Office Madurai, Batlagundu, Dindigul, Tamil Nadu – 624202.',
  instagramUrl: 'https://www.instagram.com/vathilaimotors/',
  businessCategory: 'Two-Wheeler Dealer',
  locality: 'Batlagundu, Dindigul',
  postalCode: 'Tamil Nadu – 624202',
  operatingHours: '',
  googleRating: 4.5,
  googleReviewCount: 36,
  googleRatingVerified: true,
  googleRatingSource: 'Google',
});

export function getPhoneHref(phone) {
  const value = String(phone ?? '').replace(/[^\d+]/g, '');
  return value ? `tel:${value}` : '';
}

export function getDirectionsUrl(address) {
  return address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
    : '';
}

export function getWhatsAppHref(phone) {
  const value = String(phone ?? '').replace(/\D/g, '');
  return /^\d{11,15}$/.test(value) ? `https://wa.me/${value}` : '';
}
