// Buyer: everything they have sent (offers, applications, questions) and their favourites.

import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import EmptyState from '../components/EmptyState';
import PrimaryButton from '../components/PrimaryButton';
import PropertyCard from '../components/PropertyCard';
import { ErrorText, Item, Muted, P, Screen, Section } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { getEnquiriesForBuyer } from '../services/EnquiryService';
import { getBuyerActivity, withdraw } from '../services/OfferService';
import { getFavourites } from '../services/PropertyService';
import { capitalise, formatPrice } from '../theme';

export default function MyActivityScreen({ navigation }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [activity, enquiries, favourites] = await Promise.all([
      getBuyerActivity(user.id), getEnquiriesForBuyer(user.id), getFavourites(user.id),
    ]);
    setData({ ...activity, enquiries, favourites });
  }, [user.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function doWithdraw(kind, id) {
    setError('');
    try { await withdraw(kind, id, user); await load(); } catch (e) { setError(e.message); }
  }

  if (!data) return <Screen><Muted>Loading…</Muted></Screen>;
  const open = (pid) => navigation.navigate('PropertyDetail', { id: pid });

  return (
    <Screen onRefresh={load}>
      <ErrorText>{error}</ErrorText>

      <Section title={`My offers (${data.offers.length})`}>
        {data.offers.map((o) => (
          <Item key={o.id}>
            <P onPress={() => open(o.property_id)}>{o.title}: {formatPrice(o.amount, 'sale')}</P>
            <Muted>{capitalise(o.status)} · sent {o.created_at.slice(0, 10)}</Muted>
            {o.status === 'pending' ? <PrimaryButton title="Withdraw" variant="outline" onPress={() => doWithdraw('offer', o.id)} /> : null}
          </Item>
        ))}
        {!data.offers.length ? <EmptyState title="No offers yet." /> : null}
      </Section>

      <Section title={`My rental applications (${data.applications.length})`}>
        {data.applications.map((a) => (
          <Item key={a.id}>
            <P onPress={() => open(a.property_id)}>{a.title}: move in {a.move_in_date}</P>
            <Muted>{capitalise(a.status)} · sent {a.created_at.slice(0, 10)}</Muted>
            {a.status === 'pending' ? <PrimaryButton title="Withdraw" variant="outline" onPress={() => doWithdraw('application', a.id)} /> : null}
          </Item>
        ))}
        {!data.applications.length ? <EmptyState title="No applications yet." /> : null}
      </Section>

      <Section title={`My questions (${data.enquiries.length})`}>
        {data.enquiries.map((e) => (
          <Item key={e.id}>
            <P onPress={() => open(e.property_id)}>{e.property_title}: “{e.message}”</P>
            {e.reply ? <P>Answer from {e.replied_by_name}: {e.reply}</P> : <Muted>Waiting for an answer.</Muted>}
          </Item>
        ))}
        {!data.enquiries.length ? <EmptyState title="No questions yet." /> : null}
      </Section>

      <Section title={`Favourites (${data.favourites.length})`}>
        {data.favourites.map((p) => <PropertyCard key={p.id} property={p} onPress={() => open(p.id)} />)}
        {!data.favourites.length ? <EmptyState title="No favourites yet." /> : null}
      </Section>
    </Screen>
  );
}
