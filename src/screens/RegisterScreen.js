// Creates a new account in the users table. The chosen role decides which tabs the user sees.

import { useState } from 'react';
import Chip from '../components/Chip';
import PrimaryButton from '../components/PrimaryButton';
import TextField from '../components/TextField';
import { ErrorText, Muted, Row, Screen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { validateRegister } from '../services/AuthService';

const ROLE_OPTIONS = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
  { value: 'agent', label: 'Agent' },
];

export default function RegisterScreen() {
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '', role: 'buyer' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  async function handleRegister() {
    setFormError('');
    const found = validateRegister(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setLoading(true);
    try {
      await register(form); // logs the new user in straight away
    } catch (e) {
      setFormError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <TextField label="Full name" value={form.fullName} onChangeText={set('fullName')} error={errors.fullName} />
      <TextField label="Email" value={form.email} onChangeText={set('email')} keyboardType="email-address"
        autoCapitalize="none" autoCorrect={false} error={errors.email} />
      <TextField label="Phone (optional)" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
      <TextField label="Password (6 characters or more)" value={form.password} onChangeText={set('password')}
        secureTextEntry error={errors.password} />
      <TextField label="Confirm password" value={form.confirmPassword} onChangeText={set('confirmPassword')}
        secureTextEntry error={errors.confirmPassword} />
      <Muted>Account type</Muted>
      <Row>
        {ROLE_OPTIONS.map((r) => (
          <Chip key={r.value} label={r.label} selected={form.role === r.value} onPress={() => set('role')(r.value)} />
        ))}
      </Row>
      <ErrorText>{errors.role}</ErrorText>
      <ErrorText>{formError}</ErrorText>
      <PrimaryButton title="Create account" onPress={handleRegister} loading={loading} />
    </Screen>
  );
}
