// Seller home: every property the seller owns, with its status and pending offers.
// "+ New listing" opens the form; tap a listing to edit, publish, review offers or delete.

import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import EmptyState from '../components/EmptyState';
import PrimaryButton from '../components/PrimaryButton';
import PropertyCard from '../components/PropertyCard';
import { Muted, Screen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { getPropertiesForSeller } from '../services/PropertyService';

export default function MyListingsScreen({ navigation }) {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setListings(await getPropertiesForSeller(user.id));
    setLoading(false);
  }, [user.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const count = (s) => listings.filter((p) => p.status === s).length;
  const pendingText = (p) => (p.pending_offers > 0
    ? `${p.pending_offers} pending ${p.listing_type === 'sale' ? 'offer' : 'application'}${p.pending_offers === 1 ? '' : 's'}`
    : null);

  return (
    <Screen onRefresh={load}>
      <PrimaryButton title="+ New listing" onPress={() => navigation.navigate('EditListing')} />
      <Muted>
        {listings.length} listings · {count('active')} active · {count('under_offer')} under offer · {count('draft')} draft
      </Muted>
      {listings.map((p) => (
        <PropertyCard key={p.id} property={p} extra={pendingText(p)}
          onPress={() => navigation.navigate('PropertyDetail', { id: p.id })} />
      ))}
      {!loading && !listings.length ? <EmptyState title="No listings yet." message="Tap + New listing to add one." /> : null}
    </Screen>
  );
}
