import { useState } from 'react';
import { Image } from 'react-native';
import NoImage from './NoImage';

/** Shows a property photo, or the grey "No image" box if there is none or it fails to load. */
export default function PropertyPhoto({ photo, style }) {
  const [failed, setFailed] = useState(false);
  if (!photo || failed) return <NoImage style={style} />;
  return (
    <Image
      source={photo.source || { uri: photo.uri }}
      style={[{ backgroundColor: '#CCCCCC' }, style]}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}
