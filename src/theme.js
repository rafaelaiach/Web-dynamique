// Shared colours and spacing.

export const colors = {
  background: '#FFFFFF',
  card: '#FFFFFF',
  text: '#000000',
  muted: '#777777',
  border: '#999999',
  primary: '#000000',
  accent: '#000000',
  error: '#000000',
  errorSoft: '#EEEEEE',
  status: {
    draft: { bg: 'transparent', fg: '#000000', label: 'draft' },
    active: { bg: 'transparent', fg: '#000000', label: 'Active' },
    under_offer: { bg: 'transparent', fg: '#000000', label: 'under offer' },
    sold: { bg: 'transparent', fg: '#000000', label: 'SOLD' },
    rented: { bg: 'transparent', fg: '#000000', label: 'Rented' },
  },
};

export const spacing = { xs: 3, sm: 7, md: 10, lg: 15, xl: 22 };
export const radius = 0;

export function formatPrice(price, listingType) {
  const text = '£' + Math.round(price).toLocaleString('en-GB');
  return listingType === 'rent' ? `${text} pcm` : text;
}

export const PROPERTY_TYPES = ['house', 'flat', 'bungalow', 'studio', 'maisonette'];

export function capitalise(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
