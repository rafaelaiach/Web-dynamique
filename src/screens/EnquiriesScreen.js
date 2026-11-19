// Seller and agent: questions from buyers about their properties. Reply or close.

import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import EmptyState from '../components/EmptyState';
import PrimaryButton from '../components/PrimaryButton';
import TextField from '../components/TextField';
import { ErrorText, Item, Muted, P, Row, Screen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { closeEnquiry, getEnquiriesForStaff, replyEnquiry } from '../services/EnquiryService';
import { capitalise } from '../theme';

export default function EnquiriesScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState('');

  const load = useCallback(async () => setItems(await getEnquiriesForStaff(user)), [user]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function run(action) {
    setError('');
    try { await action(); await load(); } catch (e) { setError(e.message); }
  }

  if (!items) return <Screen><Muted>Loading…</Muted></Screen>;
  const openCount = items.filter((e) => e.status === 'open').length;

  return (
    <Screen onRefresh={load}>
      <Muted>{items.length} questions · {openCount} waiting for an answer</Muted>
      <ErrorText>{error}</ErrorText>
      {items.map((e) => (
        <Item key={e.id}>
          <P>{e.property_title}</P>
          <P>“{e.message}”</P>
          <Muted>{e.buyer_name}, {e.created_at.slice(0, 16)} · {capitalise(e.status)}</Muted>
          {e.reply ? <P>Answer ({e.replied_by_name}): {e.reply}</P> : null}
          {e.status !== 'closed' ? (
            <>
              <TextField value={drafts[e.id] || ''} placeholder={e.reply ? 'Change the answer' : 'Write an answer'} multiline
                onChangeText={(t) => setDrafts((d) => ({ ...d, [e.id]: t }))} />
              <Row style={{ flexWrap: 'nowrap' }}>
                <PrimaryButton title="Send answer" style={{ flex: 1 }}
                  onPress={() => run(async () => { await replyEnquiry(e.id, user, drafts[e.id]); setDrafts((d) => ({ ...d, [e.id]: '' })); })} />
                <PrimaryButton title="Close" variant="outline" style={{ flex: 1 }} onPress={() => run(() => closeEnquiry(e.id, user))} />
              </Row>
            </>
          ) : null}
        </Item>
      ))}
      {!items.length ? <EmptyState title="No questions yet." message="Questions from buyers will appear here." /> : null}
    </Screen>
  );
}
