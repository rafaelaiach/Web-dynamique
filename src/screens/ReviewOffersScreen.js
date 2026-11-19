// Seller (or managing agent): offers for a sale, or applications for a rental.
// Accepting one rejects the others and puts the property Under Offer.
// Once Under Offer: mark as Sold / Rented, or cancel the deal (back to Active).

import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import EmptyState from '../components/EmptyState';
import PrimaryButton from '../components/PrimaryButton';
import { ErrorText, Item, Muted, P, Row, Screen, Section, Title } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import {
  acceptApplication, acceptOffer, cancelDeal, completeDeal, getDecisionsForProperty, rejectApplication, rejectOffer,
} from '../services/OfferService';
import { getPropertyById } from '../services/PropertyService';
import { capitalise, formatPrice, statusLabel } from '../theme';

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

  if (!property) return <Screen><Muted>Loading…</Muted></Screen>;
  const pending = data.items.filter((i) => i.status === 'pending').length;

  return (
    <Screen onRefresh={load}>
      <Title>{property.title}</Title>
      <Muted>
        {formatPrice(property.price, property.listing_type)} · {statusLabel(property.status)} · {data.items.length} {noun}s, {pending} pending
      </Muted>
      {property.status === 'under_offer' ? (
        <Section title="Deal in progress">
          <P>An {noun} has been accepted.</P>
          <PrimaryButton title={isOffer ? 'Mark as sold' : 'Mark as rented'} disabled={busy}
            onPress={() => run(() => completeDeal(id, user))} />
          <PrimaryButton title="Deal fell through (back to Active)" variant="outline" disabled={busy}
            onPress={() => run(() => cancelDeal(id, user))} />
        </Section>
      ) : null}
      {property.status === 'draft' ? <Muted>Publish the listing to receive {noun}s.</Muted> : null}
      <ErrorText>{error}</ErrorText>

      <Section title={isOffer ? 'Offers' : 'Applications'}>
        {data.items.map((item) => (
          <Item key={item.id}>
            <P>{isOffer ? formatPrice(item.amount, 'sale') : `Move in ${item.move_in_date}`} · {capitalise(item.status)}</P>
            <Muted>{item.buyer_name} ({item.buyer_email}), {item.created_at.slice(0, 16)}</Muted>
            {isOffer && item.message ? <P>“{item.message}”</P> : null}
            {!isOffer && item.notes ? <P>Notes: {item.notes}</P> : null}
            {item.status === 'pending' && property.status === 'active' ? (
              <Row style={{ flexWrap: 'nowrap' }}>
                <PrimaryButton title="Accept" style={{ flex: 1 }} disabled={busy} onPress={() => confirmAccept(item)} />
                <PrimaryButton title="Reject" variant="outline" style={{ flex: 1 }} disabled={busy}
                  onPress={() => run(() => (isOffer ? rejectOffer : rejectApplication)(item.id, user))} />
              </Row>
            ) : null}
          </Item>
        ))}
        {!data.items.length ? <EmptyState title={`No ${noun}s yet.`} message="They will appear here when buyers send them." /> : null}
      </Section>
    </Screen>
  );
}
