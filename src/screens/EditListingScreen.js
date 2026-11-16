// Seller: create a new listing, or edit an existing one.
// From Under Offer on, price / type / location are shown as locked (read-only).

import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Chip from '../components/Chip';
import PrimaryButton from '../components/PrimaryButton';
import StatusPill from '../components/StatusPill';
import TextField from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { isFieldLocked } from '../services/ListingLifecycle';
import { createListing, getPropertyById, updateListing, validateListing } from '../services/PropertyService';
import { capitalise, colors, formatPrice, PROPERTY_TYPES, spacing } from '../theme';

const EMPTY = {
  title: '', description: '', price: '', listing_type: 'sale', property_type: 'house',
  address_line: '', city: '', postcode: '', bedrooms: '1', bathrooms: '1',
};

const LABELS = {
  price: 'Price', listing_type: 'Type', property_type: 'Property type',
  address_line: 'Address', city: 'City', postcode: 'Postcode',
};

export default function EditListingScreen({ route, navigation }) {
  const id = route.params?.id;
  const { user } = useAuth();
  const [values, setValues] = useState(EMPTY);
  const [status, setStatus] = useState('draft');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: id ? 'Edit listing' : 'New listing' });
    if (!id) return;
    (async () => {
      const p = await getPropertyById(id);
      if (p) {
        setStatus(p.status);
        setValues(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, p[k] == null ? '' : String(p[k])])));
      }
      setLoading(false);
    })();
  }, [id, navigation]);

  const set = (field) => (text) => {
    setValues((v) => ({ ...v, [field]: text }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };
  const locked = (field) => isFieldLocked(status, field);

  async function save() {
    setFormError('');
    const e = validateListing(values);
    setErrors(e);
    if (Object.keys(e).length) { setFormError('Please fix the fields marked below.'); return; }
    setSaving(true);
    try {
      if (id) {
        // Only send fields that can still be changed at this status.
        const editable = Object.fromEntries(Object.entries(values).filter(([k]) => !locked(k)));
        await updateListing(user, id, editable);
        navigation.goBack();
      } else {
        const newId = await createListing(user, values);
        Alert.alert('Listing saved as draft', 'Publish it from the property page when it is ready.');
        navigation.replace('PropertyDetail', { id: newId });
      }
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

  const lockedField = (field, display) => (
    <View key={field}>
      <Text style={styles.label}>{LABELS[field]}: (locked)</Text>
      <Text style={styles.lockedValue}>{display}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {id ? <View style={styles.row}><Text>Status: </Text><StatusPill status={status} /></View> : null}
        {status !== 'draft' && status !== 'active' ? (
          <Text style={styles.notice}>
            This property is {status.replace('_', ' ')}. Price, type and location can no longer be changed.
          </Text>
        ) : null}
        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <TextField label="Title" value={values.title} onChangeText={set('title')} error={errors.title} placeholder="e.g. Jackson Avenue" />
        <TextField label="Description" value={values.description} onChangeText={set('description')} multiline
          style={styles.multiline} placeholder="Describe the property" />

        {locked('listing_type') ? lockedField('listing_type', values.listing_type === 'sale' ? 'For sale' : 'To rent') : (
          <View>
            <Text style={styles.label}>Type:</Text>
            <View style={styles.chips}>
              <Chip label="For sale" selected={values.listing_type === 'sale'} onPress={() => set('listing_type')('sale')} />
              <Chip label="To rent" selected={values.listing_type === 'rent'} onPress={() => set('listing_type')('rent')} />
            </View>
            {errors.listing_type ? <Text style={styles.error}>{errors.listing_type}</Text> : null}
          </View>
        )}

        {locked('price') ? lockedField('price', formatPrice(Number(values.price), values.listing_type)) : (
          <TextField label={values.listing_type === 'rent' ? 'Rent per month (£)' : 'Price (£)'} value={values.price}
            onChangeText={set('price')} error={errors.price} keyboardType="numeric" />
        )}

        {locked('property_type') ? lockedField('property_type', capitalise(values.property_type)) : (
          <View>
            <Text style={styles.label}>Property type:</Text>
            <View style={styles.chips}>
              {PROPERTY_TYPES.map((t) => (
                <Chip key={t} label={capitalise(t)} selected={values.property_type === t} onPress={() => set('property_type')(t)} />
              ))}
            </View>
            {errors.property_type ? <Text style={styles.error}>{errors.property_type}</Text> : null}
          </View>
        )}

        {['address_line', 'city', 'postcode'].map((f) => (locked(f) ? lockedField(f, values[f]) : (
          <TextField key={f} label={LABELS[f]} value={values[f]} onChangeText={set(f)} error={errors[f]}
            autoCapitalize={f === 'postcode' ? 'characters' : 'words'} />
        )))}

        <View style={styles.row2}>
          <TextField label="Bedrooms" value={values.bedrooms} onChangeText={set('bedrooms')} error={errors.bedrooms}
            keyboardType="number-pad" style={{ flex: 1 }} />
          <TextField label="Bathrooms" value={values.bathrooms} onChangeText={set('bathrooms')} error={errors.bathrooms}
            keyboardType="number-pad" style={{ flex: 1 }} />
        </View>

        <Text style={styles.hint}>Photos are simulated: new listings show a "No image" frame.</Text>
        <PrimaryButton title={id ? 'Save changes' : 'Save as draft'} onPress={save} loading={saving} />
        <PrimaryButton title="Cancel" variant="outline" onPress={() => navigation.goBack()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 12, gap: spacing.md, paddingBottom: 60 },
  row: { flexDirection: 'row', alignItems: 'center' },
  row2: { flexDirection: 'row', gap: spacing.md },
  label: { fontSize: 14, marginBottom: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  multiline: { minHeight: 60 },
  lockedValue: { borderWidth: 1, borderColor: '#CCC', borderStyle: 'dashed', padding: 6, color: colors.muted },
  notice: { borderWidth: 1, borderColor: '#000', padding: 8, fontSize: 13 },
  formError: { fontWeight: 'bold' },
  error: { fontSize: 12, fontStyle: 'italic', marginTop: 2 },
  hint: { fontSize: 12, color: colors.muted },
});
