import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { propertyImage } from '../assets/images';
import { capitalise, colors, formatPrice, radius, spacing } from '../theme';
import StatusPill from './StatusPill';

/** One property in a list. `extra` is an optional line under the price (e.g. "2 pending offers"). */
export default function PropertyCard({ property, onPress, extra, showStatus = true }) {
  const p = property;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <Image source={propertyImage(p.image)} style={styles.image} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.title} numberOfLines={1}>{p.title}</Text>
          {showStatus ? <StatusPill status={p.status} /> : null}
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {capitalise(p.property_type)} · {p.bedrooms} bed · {p.city} {p.postcode}
        </Text>
        <Text style={styles.price}>{formatPrice(p.price, p.listing_type)}</Text>
        {extra ? <Text style={styles.extra}>{extra}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius, borderWidth: 1,
    borderColor: colors.border, overflow: 'hidden',
  },
  image: { width: 104, height: 104 },
  body: { flex: 1, padding: spacing.md, gap: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, fontSize: 15.5, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12.5, color: colors.muted },
  price: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 2 },
  extra: { fontSize: 12.5, color: colors.accent, fontWeight: '600' },
});
