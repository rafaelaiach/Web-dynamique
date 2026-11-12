// Real property photos, free to use under the Unsplash License (https://unsplash.com/license).
// The database stores a short key per property (e.g. "house1"); this file maps it to photos.
// The first photo is the main one shown in lists; the others appear in the detail screen.
// Photos load from the internet. If one can't load, the app shows a grey "No image" box instead.

const unsplash = (id) => `https://images.unsplash.com/photo-${id}?w=1080&q=70&fit=crop&auto=format`;

const PHOTOS = {
  // Jackson Avenue: three-bedroom family house
  house1: [
    { uri: unsplash('1621983209348-7b5a63f23866'), credit: 'James Feaver' },
    { uri: unsplash('1669317139155-912572c38362'), credit: 'Lotus Design N Print' },
    { uri: unsplash('1746517757473-7c88850e539b'), credit: 'Spl Interiors' },
  ],
  // Riverside Flat: one-bedroom flat
  flat1: [
    { uri: unsplash('1760894492960-5b0a2da0676d'), credit: 'Cristian Pineda' },
    { uri: unsplash('1595599512948-b9831e5fc11c'), credit: 'Andrea Davis' },
    { uri: unsplash('1633836331520-e35c668f1f9d'), credit: 'Luisa Brimble' },
  ],
  // Elm Road: semi-detached house
  house2: [
    { uri: unsplash('1682554373842-bda345b71f3d'), credit: 'Josh Smith' },
    { uri: unsplash('1492138645880-160f6a5136fa'), credit: 'Grovemade' },
  ],
  // Oak Lane Studio
  studio1: [
    { uri: unsplash('1647531413760-c96074b8d72b'), credit: 'July' },
    { uri: unsplash('1633836331520-e35c668f1f9d'), credit: 'Luisa Brimble' },
  ],
  // Meadow Bungalow
  bungalow1: [
    { uri: unsplash('1604166168285-173fa2afad18'), credit: 'Phil Hearing' },
    { uri: unsplash('1588880331179-bc9b93a8cb5e'), credit: 'Abby Rurenko' },
  ],
  // Mill Cottage: flat in a converted mill
  flat2: [
    { uri: unsplash('1699976102698-47feeeb07074'), credit: 'Melody Zimmerman' },
    { uri: unsplash('1746517757473-7c88850e539b'), credit: 'Spl Interiors' },
  ],
};

/** All photos for a property (empty array if none). */
export function propertyPhotos(key) {
  return PHOTOS[key] || [];
}

/** Main photo for lists, or null. */
export function mainPhoto(key) {
  return propertyPhotos(key)[0] || null;
}
