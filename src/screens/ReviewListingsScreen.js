// Agent: draft listings waiting for review. Approve (goes Active) or send back to the seller with a reason.

import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import EmptyState from '../components/EmptyState';
import PrimaryButton from '../components/PrimaryButton';
import PropertyCard from '../components/PropertyCard';
import TextField from '../components/TextField';
import { ErrorText, Item, Muted, Row, Screen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { approveListing, getDraftsForReview, returnListing } from '../services/AgentService';

export default function ReviewListingsScreen({ navigation }) {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState(null);
  const [reasons, setReasons] = useState({});
  const [error, setError] = useState('');

  const load = useCallback(async () => setDrafts(await getDraftsForReview(user)), [user]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function run(action) {
    setError('');
    try { await action(); await load(); } catch (e) { setError(e.message); }
  }

  if (!drafts) return <Screen><Muted>Loading…</Muted></Screen>;

  return (
    <Screen onRefresh={load}>
      <Muted>{drafts.length} drafts to review. Approving a draft publishes it and makes you its agent.</Muted>
      <ErrorText>{error}</ErrorText>
      {drafts.map((p) => (
        <Item key={p.id}>
          <PropertyCard property={p} extra={`Seller: ${p.seller_name}`}
            onPress={() => navigation.navigate('PropertyDetail', { id: p.id })} />
          {p.last_note ? <Muted>Last note: {p.last_note}</Muted> : null}
          <TextField value={reasons[p.id] || ''} placeholder="Reason, if sending back"
            onChangeText={(t) => setReasons((r) => ({ ...r, [p.id]: t }))} />
          <Row style={{ flexWrap: 'nowrap' }}>
            <PrimaryButton title="Approve" style={{ flex: 1 }} onPress={() => run(() => approveListing(p.id, user))} />
            <PrimaryButton title="Send back" variant="outline" style={{ flex: 1 }}
              onPress={() => run(async () => { await returnListing(p.id, user, reasons[p.id]); setReasons((r) => ({ ...r, [p.id]: '' })); })} />
          </Row>
        </Item>
      ))}
      {!drafts.length ? <EmptyState title="Nothing to review." message="New drafts from sellers will appear here." /> : null}
    </Screen>
  );
}
