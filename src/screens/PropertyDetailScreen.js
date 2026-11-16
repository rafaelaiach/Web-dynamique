// Full details of one property, its status history, and a favourite toggle for buyers.
// Week 3: the owner (seller) can edit, publish / unpublish, review offers and delete here.
// The buyer "Make an offer" / "Apply to rent" buttons are still to be wired up (buyer screens).

import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { propertyPhotos } from '../assets/photos';
import EmptyState from '../components/EmptyState';
import PrimaryButton from '../components/PrimaryButton';
import PropertyPhoto from '../components/PropertyPhoto';
import StatusPill from '../components/StatusPill';
import { useAuth } from '../context/AuthContext';
import { canDelete, changeStatus } from '../services/ListingLifecycle';
import { deleteListing, getPropertyById, isFavourite, toggleFavourite } from '../services/PropertyService';
import { capitalise, colors, formatPrice, spacing } from '../theme';

export default function PropertyDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ownerError, setOwnerError] = useState('');
  const { width } = useWindowDimensions();

  // Reload every time the screen comes back into view (e.g. after editing).
  const load = useCallback(async () => {
    const p = await getPropertyById(id);
    setProperty(p);
    if (p && user.role === 'buyer') setSaved(await isFavourite(user.id, id));
    setLoading(false);
  }, [id, user]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function setStatus(to, note) {
    setOwnerError('');
    try { await changeStatus(id, to, user.id, note); await load(); } catch (e) { setOwnerError(e.message); }
  }

  function confirmDelete() {
    Alert.alert('Delete this listing?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try { await deleteListing(user, id); navigation.goBack(); } catch (e) { setOwnerError(e.message); }
        },
      },
    ]);
  }

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!property) return <EmptyState title="Property not found" message="It may have been removed." />;

  const p = property;
  const isBuyer = user.role === 'buyer';
  const canAct = isBuyer && p.status === 'active';
  const isOwner = user.role === 'seller' && p.seller_id === user.id;
  const done = p.status === 'sold' || p.status === 'rented';
  const noun = p.listing_type === 'sale' ? 'offers' : 'applications';
  const photos = propertyPhotos(p.image);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Swipe left/right to see more photos */}
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {(photos.length ? photos : [null]).map((photo, i) => (
          <PropertyPhoto key={i} photo={photo} style={[styles.image, { width }]} />
        ))}
      </ScrollView>
      {photos.length ? (
        <Text style={styles.credit}>
          {photos.length} photos - swipe to see more. Photos: {[...new Set(photos.map((ph) => ph.credit))].join(', ')} / Unsplash
        </Text>
      ) : null}
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

      {isOwner ? (
        <View style={styles.actions}>
          <Text style={styles.h2}>Manage listing</Text>
          {!done ? <PrimaryButton title="Edit listing" onPress={() => navigation.navigate('EditListing', { id: p.id })} /> : null}
          {p.status === 'draft' ? <PrimaryButton title="Publish (make Active)" onPress={() => setStatus('active', 'Published by seller')} /> : null}
          {p.status === 'active' ? (
            <PrimaryButton title="Unpublish (back to draft)" variant="outline" onPress={() => setStatus('draft', 'Unpublished by seller')} />
          ) : null}
          {p.status !== 'draft' ? (
            <PrimaryButton title={`Review ${noun} (${p.pending_offers} pending)`}
              onPress={() => navigation.navigate('ReviewOffers', { id: p.id })} />
          ) : null}
          {canDelete(p.status) ? <PrimaryButton title="Delete listing" variant="outline" onPress={confirmDelete} /> : null}
          {p.status === 'under_offer' ? <Text style={styles.note}>Price, type and location are locked while under offer.</Text> : null}
          {ownerError ? <Text style={styles.note}>{ownerError}</Text> : null}
        </View>
      ) : null}

      <View style={styles.history}>
        <Text style={styles.h2}>Status history</Text>
        {p.history.map((h) => (
          <View key={h.id} style={styles.historyRow}>
            <Text style={styles.historyText}>
              {h.from_status ? `${colors.status[h.from_status].label} → ` : ''}{colors.status[h.to_status].label}
            </Text>
            {h.note ? <Text style={styles.historyMeta}>{h.note}</Text> : null}
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
  image: { height: 220 },
  credit: { fontSize: 10, color: '#777', paddingHorizontal: 10 },
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
