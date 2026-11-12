// Full details of one property, its status history, and a favourite toggle for buyers.
// The "Make an offer" / "Apply to rent" buttons are wired up in Week 3.

import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import EmptyState from '../components/EmptyState';
import NoImage from '../components/NoImage';
import PrimaryButton from '../components/PrimaryButton';
import StatusPill from '../components/StatusPill';
import { useAuth } from '../context/AuthContext';
import { getPropertyById, isFavourite, toggleFavourite } from '../services/PropertyService';
import { capitalise, colors, formatPrice, spacing } from '../theme';

export default function PropertyDetailScreen({ route }) {
  const { id } = route.params;
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const p = await getPropertyById(id);
      setProperty(p);
      if (p && user.role === 'buyer') setSaved(await isFavourite(user.id, id));
      setLoading(false);
    })();
  }, [id, user]);

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!property) return <EmptyState title="Property not found" message="It may have been removed." />;

  const p = property;
  const isBuyer = user.role === 'buyer';
  const canAct = isBuyer && p.status === 'active';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <NoImage style={styles.image} />
      <View style={styles.titleRow}>
        <Text style={styles.title}>{p.title}</Text>
        <StatusPill status={p.status} />
      </View>
      <Text style={styles.price}>{formatPrice(p.price, p.listing_type)}</Text>
      <Text style={styles.facts}>
        {capitalise(p.property_type)} · {p.bedrooms} bed · {p.bathrooms} bath · {p.listing_type === 'sale' ? 'For sale' : 'To rent'}
      </Text>
      <Text style={styles.address}>{p.address_line}, {p.city} {p.postcode}</Text>
      <Text style={styles.body}>{p.description}</Text>
      <Text style={styles.meta}>Seller: {p.seller_name}{p.agent_name ? ` · Agent: ${p.agent_name}` : ''}</Text>

      {isBuyer ? (
        <View style={styles.actions}>
          <PrimaryButton
            title={saved ? '♥ Saved to favourites' : '♡ Save to favourites'}
            variant="outline"
            onPress={async () => setSaved(await toggleFavourite(user.id, p.id))}
          />
          <PrimaryButton
            title={p.listing_type === 'sale' ? 'Make an offer (Week 3)' : 'Apply to rent (Week 3)'}
            disabled
          />
          {!canAct ? <Text style={styles.note}>This property is under offer, so new offers are closed.</Text> : null}
        </View>
      ) : null}

      <View style={styles.history}>
        <Text style={styles.h2}>Status history</Text>
        {p.history.map((h) => (
          <View key={h.id} style={styles.historyRow}>
            <Text style={styles.historyText}>
              {h.from_status ? `${colors.status[h.from_status].label} → ` : ''}{colors.status[h.to_status].label}
            </Text>
            <Text style={styles.historyMeta}>{h.changed_by_name} · {h.changed_at.slice(0, 16)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xl * 2, gap: spacing.sm },
  image: { width: '100%', height: 160 },
  titleRow: { paddingHorizontal: 10, marginTop: spacing.md },
  title: { fontSize: 20, fontWeight: 'bold' },
  price: { fontSize: 18, paddingHorizontal: 14 },
  facts: { fontSize: 14, paddingHorizontal: 10 },
  address: { fontSize: 14, color: colors.muted, paddingHorizontal: spacing.lg },
  body: { fontSize: 14, paddingHorizontal: 18, marginTop: 4 },
  meta: { fontSize: 13, color: colors.muted, paddingHorizontal: spacing.lg },
  actions: { gap: spacing.md, padding: spacing.lg },
  note: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  history: { margin: 10, marginTop: 20, padding: 8, borderTopWidth: 1, borderColor: '#999', gap: 4 },
  h2: { fontSize: 15, fontWeight: 'bold', textDecorationLine: 'underline' },
  historyRow: { gap: 2 },
  historyText: { fontSize: 14, color: colors.text, fontWeight: '600' },
  historyMeta: { fontSize: 12, color: colors.muted },
});
