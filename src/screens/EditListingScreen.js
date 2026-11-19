// Seller: create a new listing, or edit an existing one.
// From Under Offer on, price / type / location are shown as locked (read-only).

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Chip from '../components/Chip';
import PrimaryButton from '../components/PrimaryButton';
import TextField from '../components/TextField';
import { ErrorText, Muted, P, Row, Screen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { isFieldLocked } from '../services/ListingLifecycle';
import { createListing, getPropertyById, updateListing, validateListing } from '../services/PropertyService';
import { capitalise, formatPrice, PROPERTY_TYPES, statusLabel } from '../theme';

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
        navigation.replace('PropertyDetail', { id: newId });
      }
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Screen><Muted>Loading…</Muted></Screen>;

  const lockedField = (field, display) => (
    <View key={field}>
      <Muted>{LABELS[field]} (locked)</Muted>
      <P>{display}</P>
    </View>
  );

  return (
    <Screen>
      {id ? <Muted>Status: {statusLabel(status)}</Muted> : null}
      {status !== 'draft' && status !== 'active' ? (
        <Muted>This property is {statusLabel(status).toLowerCase()}. Price, type and location can no longer be changed.</Muted>
      ) : null}
      <ErrorText>{formError}</ErrorText>

      <TextField label="Title" value={values.title} onChangeText={set('title')} error={errors.title} />
      <TextField label="Description" value={values.description} onChangeText={set('description')} multiline />

      {locked('listing_type') ? lockedField('listing_type', values.listing_type === 'sale' ? 'For sale' : 'To rent') : (
        <View style={{ gap: 4 }}>
          <Muted>Type</Muted>
          <Row>
            <Chip label="For sale" selected={values.listing_type === 'sale'} onPress={() => set('listing_type')('sale')} />
            <Chip label="To rent" selected={values.listing_type === 'rent'} onPress={() => set('listing_type')('rent')} />
          </Row>
          <ErrorText>{errors.listing_type}</ErrorText>
        </View>
      )}

      {locked('price') ? lockedField('price', formatPrice(Number(values.price), values.listing_type)) : (
        <TextField label={values.listing_type === 'rent' ? 'Rent per month (£)' : 'Price (£)'} value={values.price}
          onChangeText={(t) => set('price')(t.replace(/[^0-9.]/g, ''))} error={errors.price} keyboardType="numeric" />
      )}

      {locked('property_type') ? lockedField('property_type', capitalise(values.property_type)) : (
        <View style={{ gap: 4 }}>
          <Muted>Property type</Muted>
          <Row>
            {PROPERTY_TYPES.map((t) => (
              <Chip key={t} label={capitalise(t)} selected={values.property_type === t} onPress={() => set('property_type')(t)} />
            ))}
          </Row>
          <ErrorText>{errors.property_type}</ErrorText>
        </View>
      )}

      {['address_line', 'city', 'postcode'].map((f) => (locked(f) ? lockedField(f, values[f]) : (
        <TextField key={f} label={LABELS[f]} value={values[f]} onChangeText={set(f)} error={errors[f]}
          autoCapitalize={f === 'postcode' ? 'characters' : 'words'} />
      )))}

      <Row style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
        <TextField label="Bedrooms" value={values.bedrooms} onChangeText={set('bedrooms')} error={errors.bedrooms}
          keyboardType="number-pad" style={{ flex: 1 }} />
        <TextField label="Bathrooms" value={values.bathrooms} onChangeText={set('bathrooms')} error={errors.bathrooms}
          keyboardType="number-pad" style={{ flex: 1 }} />
      </Row>

      <Muted>Photos are simulated: new listings show a “No image” frame.</Muted>
      <PrimaryButton title={id ? 'Save changes' : 'Save as draft'} onPress={save} loading={saving} />
      <PrimaryButton title="Cancel" variant="outline" onPress={() => navigation.goBack()} />
    </Screen>
  );
}
