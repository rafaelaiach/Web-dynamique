// Full details of one property and its status history, with the actions of each role:
// buyer: favourite, make an offer / apply to rent, ask a question
// seller (owner): edit, publish / unpublish, review offers, delete
// agent (managing): change status, review offers

import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { propertyPhotos } from '../assets/photos';
import EmptyState from '../components/EmptyState';
import PrimaryButton from '../components/PrimaryButton';
import PropertyPhoto from '../components/PropertyPhoto';
import TextField from '../components/TextField';
import { ErrorText, Item, KeyValue, Muted, P, Screen, Section, Title } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { agentChangeStatus } from '../services/AgentService';
import { sendEnquiry } from '../services/EnquiryService';
import { canDelete, changeStatus } from '../services/ListingLifecycle';
import { deleteListing, getPropertyById, isFavourite, toggleFavourite } from '../services/PropertyService';
import { capitalise, formatPrice, spacing, statusLabel } from '../theme';

export default function PropertyDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [question, setQuestion] = useState('');
  const [questionSent, setQuestionSent] = useState(false);
  const { width } = useWindowDimensions();

  // Reload every time the screen comes back into view (e.g. after editing).
  const load = useCallback(async () => {
    const p = await getPropertyById(id);
    setProperty(p);
    if (p && user.role === 'buyer') setSaved(await isFavourite(user.id, id));
    setLoading(false);
  }, [id, user]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function run(action) {
    setError('');
    try { await action(); await load(); } catch (e) { setError(e.message); }
  }

  async function ask() {
    setError('');
    try {
      await sendEnquiry(user, id, question);
      setQuestion('');
      setQuestionSent(true);
    } catch (e) { setError(e.message); }
  }

  function confirmDelete() {
    Alert.alert('Delete this listing?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try { await deleteListing(user, id); navigation.goBack(); } catch (e) { setError(e.message); }
        },
      },
    ]);
  }

  if (loading) return <Screen><Muted>Loading…</Muted></Screen>;
  if (!property) return <Screen><EmptyState title="Property not found." message="It may have been deleted." /></Screen>;

  const p = property;
  const isSale = p.listing_type === 'sale';
  const isBuyer = user.role === 'buyer';
  const isOwner = user.role === 'seller' && p.seller_id === user.id;
  const isAgent = user.role === 'agent' && p.agent_id === user.id;
  const done = p.status === 'sold' || p.status === 'rented';
  const noun = isSale ? 'offers' : 'applications';
  const photos = propertyPhotos(p.image);

  return (
    <Screen style={{ paddingTop: 0, paddingHorizontal: 0 }}>
      {/* Swipe left/right to see more photos */}
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {(photos.length ? photos : [null]).map((photo, i) => (
          <PropertyPhoto key={i} photo={photo} style={[styles.image, { width }]} />
        ))}
      </ScrollView>

      <Screen.Body>
        {photos.length ? (
          <Muted>{photos.length} photos, swipe for more. Photos: {[...new Set(photos.map((ph) => ph.credit))].join(', ')} / Unsplash</Muted>
        ) : null}
        <Title>{p.title}</Title>
        <P>{formatPrice(p.price, p.listing_type)} · {statusLabel(p.status)}</P>
        <Muted>{p.address_line}, {p.city} {p.postcode}</Muted>
        <P>{p.description}</P>

        <Section title="Details">
          <KeyValue label="Type" value={isSale ? 'For sale' : 'To rent'} />
          <KeyValue label="Property" value={capitalise(p.property_type)} />
          <KeyValue label="Bedrooms" value={p.bedrooms} />
          <KeyValue label="Bathrooms" value={p.bathrooms} />
          <KeyValue label="Seller" value={p.seller_name} />
          <KeyValue label="Agent" value={p.agent_name || '–'} />
        </Section>

        {isBuyer ? (
          <Section title="Interested?">
            {p.status === 'active' ? (
              <PrimaryButton title={isSale ? 'Make an offer' : 'Apply to rent'}
                onPress={() => navigation.navigate('MakeOffer', { id: p.id })} />
            ) : <Muted>This property is {statusLabel(p.status).toLowerCase()}, so new {noun} are closed.</Muted>}
            <PrimaryButton title={saved ? 'Saved (tap to remove)' : 'Save to favourites'} variant="outline"
              onPress={async () => setSaved(await toggleFavourite(user.id, p.id))} />
            <TextField label="Ask a question" value={question} onChangeText={(t) => { setQuestion(t); setQuestionSent(false); }}
              multiline placeholder="e.g. Is parking included?" />
            <PrimaryButton title="Send question" variant="outline" onPress={ask} disabled={!question.trim()} />
            {questionSent ? <Muted>Question sent. The answer will appear in Activity.</Muted> : null}
          </Section>
        ) : null}

        {isOwner ? (
          <Section title="Manage listing">
            {!done ? <PrimaryButton title="Edit listing" onPress={() => navigation.navigate('EditListing', { id: p.id })} /> : null}
            {p.status === 'draft' ? (
              <PrimaryButton title="Publish" variant="outline" onPress={() => run(() => changeStatus(id, 'active', user.id, 'Published by seller'))} />
            ) : null}
            {p.status === 'active' ? (
              <PrimaryButton title="Unpublish (back to draft)" variant="outline"
                onPress={() => run(() => changeStatus(id, 'draft', user.id, 'Unpublished by seller'))} />
            ) : null}
            {p.status !== 'draft' ? (
              <PrimaryButton title={`Review ${noun} (${p.pending_offers} pending)`} variant="outline"
                onPress={() => navigation.navigate('ReviewOffers', { id: p.id })} />
            ) : null}
            {canDelete(p.status) ? <PrimaryButton title="Delete listing" variant="outline" onPress={confirmDelete} /> : null}
            {p.status === 'under_offer' ? <Muted>Price, type and location are locked while under offer.</Muted> : null}
          </Section>
        ) : null}

        {isAgent ? (
          <Section title="Agent">
            {p.status === 'draft' ? (
              <PrimaryButton title="Review this draft" onPress={() => navigation.navigate('Review')} />
            ) : null}
            {p.status === 'active' ? (
              <PrimaryButton title="Take off the market (back to draft)" variant="outline"
                onPress={() => run(() => agentChangeStatus(id, user, 'draft'))} />
            ) : null}
            {p.status !== 'draft' ? (
              <PrimaryButton title={`Review ${noun} (${p.pending_offers} pending)`} variant="outline"
                onPress={() => navigation.navigate('ReviewOffers', { id: p.id })} />
            ) : null}
          </Section>
        ) : null}

        <ErrorText>{error}</ErrorText>

        <Section title="Status history">
          {p.history.map((h) => (
            <Item key={h.id}>
              <P>{h.from_status && h.from_status !== h.to_status ? `${statusLabel(h.from_status)} → ` : ''}{statusLabel(h.to_status)}</P>
              {h.note ? <Muted>{h.note}</Muted> : null}
              <Muted>{h.changed_by_name}, {h.changed_at.slice(0, 16)}</Muted>
            </Item>
          ))}
        </Section>
      </Screen.Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  image: { height: 240, marginBottom: spacing.xs },
});
