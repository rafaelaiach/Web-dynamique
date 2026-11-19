// Seller (or managing agent): offers for a sale, or applications for a rental.
// Accepting one rejects the others and puts the property Under Offer.
// Once Under Offer: mark as Sold / Rented, or cancel the deal (back to Active).

import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import EmptyState from '../components/EmptyState';
import PrimaryButton from '../components/PrimaryButton';
import StatusPill from '../components/StatusPill';
import { useAuth } from '../context/AuthContext';
import {
  acceptApplication, acceptOffer, cancelDeal, completeDeal, getDecisionsForProperty, rejectApplication, rejectOffer,
} from '../services/OfferService';
import { getPropertyById } from '../services/PropertyService';
import { colors, formatPrice, spacing } from '../theme';

export default function ReviewOffersScreen({ route }) {
  const { id } = route.params;
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [data, setData] = useState({ kind: 'offer', items: [] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setProperty(await getPropertyById(id));
    setData(await getDecisionsForProperty(id));
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function run(action) {
    setError('');
    setBusy(true);
    try { await action(); await load(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  const isOffer = data.kind === 'offer';
  const noun = isOffer ? 'offer' : 'application';

  function confirmAccept(item) {
    const what = isOffer ? `the offer of ${formatPrice(item.amount, 'sale')}` : 'this application';
    Alert.alert(`Accept ${what}?`, `All other pending ${noun}s will be rejected and the property will go Under Offer.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Accept', onPress: () => run(() => (isOffer ? acceptOffer : acceptApplication)(item.id, user)) },
    ]);
  }

  if (!property) return null;
  const pending = data.items.filter((i) => i.status === 'pending').length;

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={data.items}
      keyExtractor={(i) => String(i.id)}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>{property.title}</Text>
          <View style={styles.row}><Text>Status: </Text><StatusPill status={property.status} /></View>
          <Text style={styles.muted}>
            {formatPrice(property.price, property.listing_type)} · {data.items.length} {noun}s · {pending} pending
          </Text>
          {property.status === 'under_offer' ? (
            <View style={styles.box}>
              <Text>An {noun} has been accepted.</Text>
              <PrimaryButton title={isOffer ? 'Mark as SOLD' : 'Mark as Rented'} disabled={busy}
                onPress={() => run(() => completeDeal(id, user))} />
              <PrimaryButton title="Deal fell through (back to Active)" variant="outline" disabled={busy}
                onPress={() => run(() => cancelDeal(id, user))} />
            </View>
          ) : null}
          {property.status === 'draft' ? <Text style={styles.muted}>Publish the listing to receive {noun}s.</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.itemTitle}>
            {isOffer ? formatPrice(item.amount, 'sale') : `Move in: ${item.move_in_date}`}
            {'  '}<Text style={styles.status}>[{item.status}]</Text>
          </Text>
          <Text>{item.buyer_name} ({item.buyer_email})</Text>
          {isOffer && item.message ? <Text style={styles.muted}>"{item.message}"</Text> : null}
          {!isOffer && item.notes ? <Text style={styles.muted}>Notes: {item.notes}</Text> : null}
          <Text style={styles.small}>Sent {item.created_at.slice(0, 16)}</Text>
          {item.status === 'pending' && property.status === 'active' ? (
            <View style={styles.buttons}>
              <PrimaryButton title="Accept" style={{ flex: 1 }} disabled={busy} onPress={() => confirmAccept(item)} />
              <PrimaryButton title="Reject" variant="outline" style={{ flex: 1 }} disabled={busy}
                onPress={() => run(() => (isOffer ? rejectOffer : rejectApplication)(item.id, user))} />
            </View>
          ) : null}
        </View>
      )}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      ListEmptyComponent={<EmptyState title={`No ${noun}s yet`} message={`${isOffer ? 'Offers' : 'Applications'} from buyers will appear here.`} />}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 10, paddingBottom: 40 },
  header: { gap: 6, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center' },
  muted: { color: colors.muted, fontSize: 13 },
  small: { color: colors.muted, fontSize: 11 },
  box: { borderWidth: 1, borderColor: '#000', padding: 8, gap: 6 },
  error: { fontWeight: 'bold' },
  item: { borderWidth: 1, borderColor: '#999', padding: 8, gap: 2 },
  itemTitle: { fontSize: 15, fontWeight: 'bold' },
  status: { fontWeight: 'normal', fontSize: 13 },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 6 },
});
