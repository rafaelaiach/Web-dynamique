// One style for the whole app: black on white, one font size scale, one spacing unit.

export const colors = {
  background: '#FFFFFF',
  text: '#000000',
  muted: '#666666',
  line: '#000000',
  faint: '#DDDDDD',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24 };

export const font = { small: 12, body: 15, title: 22, heading: 13 };

export const STATUS_LABELS = {
  draft: 'Draft',
  active: 'Active',
  under_offer: 'Under offer',
  sold: 'Sold',
  rented: 'Rented',
};

export function statusLabel(status) {
  return STATUS_LABELS[status] || status;
}

export function formatPrice(price, listingType) {
  const text = '£' + Math.round(price).toLocaleString('en-GB');
  return listingType === 'rent' ? `${text} pcm` : text;
}

export const PROPERTY_TYPES = ['house', 'flat', 'bungalow', 'studio', 'maisonette'];

export function capitalise(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}
