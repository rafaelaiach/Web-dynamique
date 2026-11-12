// Seller home: every property the logged-in seller owns, with its status and pending offers.
// Create / edit / delete arrive in Week 3.

import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import EmptyState from '../components/EmptyState';
import PrimaryButton from '../components/PrimaryButton';
import PropertyCard from '../components/PropertyCard';
import { useAuth } from '../context/AuthContext';
import { getPropertiesForSeller } from '../services/PropertyService';
import { colors, spacing } from '../theme';

export default function MyListingsScreen({ navigation }) {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setListings(await getPropertiesForSeller(user.id));
    setLoading(false);
  }, [user.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const counts = listings.reduce((acc, p) => ({ ...acc, [p.status]: (acc[p.status] || 0) + 1 }), {});

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={listings}
      keyExtractor={(p) => String(p.id)}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.summary}>
            {listings.length} total · {counts.active || 0} active · {counts.under_offer || 0} under offer · {counts.draft || 0} draft
          </Text>
          <PrimaryButton title="+ New listing (Week 3)" disabled />
        </View>
      }
      renderItem={({ item }) => (
        <PropertyCard
          property={item}
          extra={item.listing_type === 'sale' && item.pending_offers > 0
            ? `${item.pending_offers} pending ${item.pending_offers === 1 ? 'offer' : 'offers'}` : null}
          onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      ListEmptyComponent={loading ? null : (
        <EmptyState title="No listings yet" message="Your properties will appear here once you add them." />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  header: { gap: spacing.md, marginBottom: spacing.lg },
  summary: { fontSize: 13, color: colors.muted },
});
