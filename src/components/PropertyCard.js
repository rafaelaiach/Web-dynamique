import { Pressable, StyleSheet, Text, View } from 'react-native';
import { capitalise, formatPrice } from '../theme';
import NoImage from './NoImage';
import StatusPill from './StatusPill';

/** One property in a list. `extra` is an optional line under the price (e.g. "2 pending offers"). */
export default function PropertyCard({ property, onPress, extra, showStatus = true }) {
  const p = property;
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <NoImage style={styles.image} />
      <View style={styles.body}>
        <Text style={styles.title}>{p.title}</Text>
        {showStatus ? <StatusPill status={p.status} /> : null}
        <Text style={styles.meta}>
          {capitalise(p.property_type)} - {p.bedrooms} bed - {p.city} {p.postcode}
        </Text>
        <Text style={styles.price}>{formatPrice(p.price, p.listing_type)}</Text>
        {extra ? <Text>{extra}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', borderWidth: 1, borderColor: '#999', paddingLeft: 4, paddingTop: 6, paddingBottom: 2 },
  image: { width: 80, height: 70 },
  body: { flex: 1, paddingLeft: 12, paddingRight: 4 },
  title: { fontSize: 16, fontWeight: 'bold' },
  meta: { fontSize: 12, color: '#777', marginTop: 4 },
  price: { fontSize: 14, marginTop: 1 },
});
