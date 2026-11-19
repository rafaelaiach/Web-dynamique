// Buyer home: browse Active / Under Offer properties from the database,
// filtered by sale vs rent, location, property type and price range.

import { useCallback, useState } from 'react';
import { Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import PropertyCard from '../components/PropertyCard';
import TextField from '../components/TextField';
import { ErrorText, Muted, P, Row, Screen } from '../components/ui';
import { searchProperties } from '../services/PropertyService';
import { capitalise, PROPERTY_TYPES } from '../theme';

const LISTING_TYPES = [
  { value: null, label: 'All' },
  { value: 'sale', label: 'For sale' },
  { value: 'rent', label: 'To rent' },
];

export default function HomeScreen({ navigation }) {
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

  return (
    <Screen onRefresh={load}>
      <TextField value={city} onChangeText={setCity} placeholder="City or postcode" autoCorrect={false} />
      <Row>
        {LISTING_TYPES.map((t) => (
          <Chip key={t.label} label={t.label} selected={listingType === t.value} onPress={() => setListingType(t.value)} />
        ))}
      </Row>
      <Pressable onPress={() => setShowMore((v) => !v)}>
        <P style={{ textDecorationLine: 'underline' }}>{showMore ? 'Hide filters' : 'More filters'}</P>
      </Pressable>
      {showMore ? (
        <>
          <Row>
            <Chip label="Any type" selected={!propertyType} onPress={() => setPropertyType(null)} />
            {PROPERTY_TYPES.map((t) => (
              <Chip key={t} label={capitalise(t)} selected={propertyType === t} onPress={() => setPropertyType(t)} />
            ))}
          </Row>
          <Row style={{ flexWrap: 'nowrap' }}>
            <TextField style={{ flex: 1 }} label="Min price (£)" value={minPrice} onChangeText={onlyDigits(setMinPrice)} keyboardType="number-pad" />
            <TextField style={{ flex: 1 }} label="Max price (£)" value={maxPrice} onChangeText={onlyDigits(setMaxPrice)} keyboardType="number-pad" />
          </Row>
        </>
      ) : null}

      <Muted>{loading ? 'Loading…' : `${properties.length} ${properties.length === 1 ? 'property' : 'properties'}`}</Muted>
      <ErrorText>{error ? `Could not load properties: ${error}` : ''}</ErrorText>
      {properties.map((p) => (
        <PropertyCard key={p.id} property={p} onPress={() => navigation.navigate('PropertyDetail', { id: p.id })} />
      ))}
      {!loading && !properties.length ? <EmptyState title="No properties match." message="Try another city or remove a filter." /> : null}
    </Screen>
  );
}
