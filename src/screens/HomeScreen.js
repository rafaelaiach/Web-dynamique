// Buyer home: browse Active / Under Offer properties from the database,
// filtered by sale vs rent, location, property type and price range.

import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import PropertyCard from '../components/PropertyCard';
import TextField from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { searchProperties } from '../services/PropertyService';
import { capitalise, colors, PROPERTY_TYPES, spacing } from '../theme';

const LISTING_TYPES = [
  { value: null, label: 'All' },
  { value: 'sale', label: 'For sale' },
  { value: 'rent', label: 'To rent' },
];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [listingType, setListingType] = useState(null);
  const [propertyType, setPropertyType] = useState(null);
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setProperties(await searchProperties({ listingType, propertyType, city, minPrice, maxPrice }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [listingType, propertyType, city, minPrice, maxPrice]);

  // Reload whenever a filter changes or the screen comes back into view.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onlyDigits = (setter) => (text) => setter(text.replace(/[^0-9]/g, ''));

  const header = (
    <View style={styles.header}>
      <Text style={styles.greeting}>Hello {user.fullName.split(' ')[0]}</Text>
      <TextField value={city} onChangeText={setCity} placeholder="Search city or postcode" autoCorrect={false} />
      <View style={styles.chips}>
        {LISTING_TYPES.map((t) => (
          <Chip key={t.label} label={t.label} selected={listingType === t.value} onPress={() => setListingType(t.value)} />
        ))}
        <Pressable onPress={() => setShowMore((v) => !v)} style={styles.more}>
          <Text style={styles.moreText}>{showMore ? 'Fewer filters' : 'More filters'}</Text>
        </Pressable>
      </View>
      {showMore ? (
        <View style={styles.moreBox}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip label="Any type" selected={!propertyType} onPress={() => setPropertyType(null)} />
            {PROPERTY_TYPES.map((t) => (
              <Chip key={t} label={capitalise(t)} selected={propertyType === t} onPress={() => setPropertyType(t)} />
            ))}
          </ScrollView>
          <View style={styles.priceRow}>
            <TextField style={{ flex: 1 }} value={minPrice} onChangeText={onlyDigits(setMinPrice)} placeholder="Min £" keyboardType="number-pad" />
            <TextField style={{ flex: 1 }} value={maxPrice} onChangeText={onlyDigits(setMaxPrice)} placeholder="Max £" keyboardType="number-pad" />
          </View>
        </View>
      ) : null}
      <Text style={styles.count}>
        {loading ? 'Loading…' : `${properties.length} ${properties.length === 1 ? 'property' : 'properties'}`}
      </Text>
      {error ? <Text style={styles.error}>Could not load properties: {error}</Text> : null}
    </View>
  );

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={properties}
      keyExtractor={(p) => String(p.id)}
      ListHeaderComponent={header}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      renderItem={({ item }) => (
        <PropertyCard property={item} onPress={() => navigation.navigate('PropertyDetail', { id: item.id })} />
      )}
      ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      ListEmptyComponent={loading ? null : (
        <EmptyState title="No properties match" message="Try another city or remove a filter." />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  content: { padding: 10, paddingBottom: 40 },
  header: { gap: 8, marginBottom: 12 },
  greeting: { fontSize: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  more: { paddingHorizontal: spacing.sm, paddingVertical: 6 },
  moreText: { textDecorationLine: 'underline', fontSize: 13 },
  moreBox: { gap: spacing.md },
  priceRow: { flexDirection: 'row', gap: spacing.md },
  count: { fontSize: 13, color: colors.muted },
  error: { color: colors.error },
});
