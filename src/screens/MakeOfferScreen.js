// Buyer: make an offer on a sale, or apply for a rental (move-in date + optional notes).

import { useEffect, useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';
import TextField from '../components/TextField';
import { ErrorText, Muted, P, Screen, Title } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { applyToRent, makeOffer } from '../services/OfferService';
import { getPropertyById } from '../services/PropertyService';
import { formatPrice } from '../theme';

export default function MakeOfferScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [amount, setAmount] = useState('');
  const [moveIn, setMoveIn] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    getPropertyById(id).then((p) => {
      setProperty(p);
      navigation.setOptions({ title: p && p.listing_type === 'rent' ? 'Apply to rent' : 'Make an offer' });
    });
  }, [id, navigation]);

  if (!property) return <Screen><Muted>Loading…</Muted></Screen>;
  const isSale = property.listing_type === 'sale';

  async function submit() {
    setError('');
    setSaving(true);
    try {
      if (isSale) await makeOffer(user.id, id, amount, text);
      else await applyToRent(user.id, id, moveIn.trim(), text);
      setSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (sent) {
    return (
      <Screen>
        <Title>{isSale ? 'Offer sent.' : 'Application sent.'}</Title>
        <P>The seller or agent will accept or reject it. You can follow it in Activity.</P>
        <PrimaryButton title="Back to the property" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>{property.title}</Title>
      <Muted>{isSale ? 'Asking price' : 'Rent'}: {formatPrice(property.price, property.listing_type)}</Muted>
      {isSale ? (
        <TextField label="Your offer (£)" value={amount} keyboardType="number-pad"
          onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))} />
      ) : (
        <TextField label="Move-in date (YYYY-MM-DD)" value={moveIn} onChangeText={setMoveIn}
          placeholder="2027-01-15" keyboardType="numbers-and-punctuation" autoCorrect={false} />
      )}
      <TextField label={isSale ? 'Message (optional)' : 'Notes (optional)'} value={text} onChangeText={setText} multiline />
      {isSale ? <Muted>You can make more than one offer. Only one offer per property can be accepted.</Muted> : null}
      <ErrorText>{error}</ErrorText>
      <PrimaryButton title={isSale ? 'Send offer' : 'Send application'} onPress={submit} loading={saving} />
    </Screen>
  );
}
