// Shared colours and spacing so every screen looks the same.

export const colors = {
  background: '#F5F7FA',
  card: '#FFFFFF',
  text: '#15233D',
  muted: '#5B6780',
  border: '#D9DFE9',
  primary: '#1E3A6E',
  accent: '#C2410C',
  error: '#B91C1C',
  errorSoft: '#FBE4E4',
  status: {
    draft: { bg: '#EAEEF5', fg: '#5B6780', label: 'Draft' },
    active: { bg: '#E3F4E8', fg: '#15803D', label: 'Active' },
    under_offer: { bg: '#FBF1D9', fg: '#A16207', label: 'Under Offer' },
    sold: { bg: '#E3EBFC', fg: '#1D4ED8', label: 'Sold' },
    rented: { bg: '#E3EBFC', fg: '#1D4ED8', label: 'Rented' },
  },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = 10;

export function formatPrice(price, listingType) {
  const text = '£' + Math.round(price).toLocaleString('en-GB');
  return listingType === 'rent' ? `${text} pcm` : text;
}

export const PROPERTY_TYPES = ['house', 'flat', 'bungalow', 'studio', 'maisonette'];

export function capitalise(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
