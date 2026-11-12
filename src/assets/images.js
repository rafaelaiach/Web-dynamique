// Mock property photos. The database stores a short name (e.g. "house1");
// this file maps it to a bundled image.

const images = {
  house1: require('./properties/house1.png'),
  house2: require('./properties/house2.png'),
  flat1: require('./properties/flat1.png'),
  flat2: require('./properties/flat2.png'),
  studio1: require('./properties/studio1.png'),
  bungalow1: require('./properties/bungalow1.png'),
};

export function propertyImage(name) {
  return images[name] || images.house1;
}
