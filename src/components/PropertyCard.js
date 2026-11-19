import { Pressable, StyleSheet, Text, View } from 'react-native';
import { mainPhoto } from '../assets/photos';
import { capitalise, colors, font, formatPrice, spacing, statusLabel } from '../theme';
import PropertyPhoto from './PropertyPhoto';

/** One property in a list. `extra` is an optional last line (e.g. "2 pending offers"). */
export default function PropertyCard({ property, onPress, extra }) {
  const p = property;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.5 }]}>
      <PropertyPhoto photo={mainPhoto(p.image)} style={styles.image} />
      <View style={styles.body}>
        <Text style={styles.title}>{p.title}</Text>
        <Text style={styles.text}>{formatPrice(p.price, p.listing_type)}</Text>
        <Text style={styles.muted}>
          {capitalise(p.property_type)}, {p.bedrooms} bed, {p.city} · {statusLabel(p.status)}
        </Text>
        {extra ? <Text style={styles.muted}>{extra}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.faint },
  image: { width: 88, height: 72 },
  body: { flex: 1, gap: 2 },
  title: { fontSize: font.body, color: colors.text },
  text: { fontSize: font.body, color: colors.text },
  muted: { fontSize: font.small, color: colors.muted },
});
