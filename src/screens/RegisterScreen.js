// Creates a new account in the users table. The chosen role decides which tabs the user sees.

import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Chip from '../components/Chip';
import PrimaryButton from '../components/PrimaryButton';
import TextField from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { validateRegister } from '../services/AuthService';
import { colors, radius, spacing } from '../theme';

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
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField label="Full name" value={form.fullName} onChangeText={set('fullName')} placeholder="Amira Khan" error={errors.fullName} />
        <TextField label="Email" value={form.email} onChangeText={set('email')} placeholder="name@example.com"
          keyboardType="email-address" autoCapitalize="none" autoCorrect={false} error={errors.email} />
        <TextField label="Phone (optional)" value={form.phone} onChangeText={set('phone')} placeholder="07700 900000" keyboardType="phone-pad" />
        <TextField label="Password" value={form.password} onChangeText={set('password')} placeholder="At least 6 characters"
          secureTextEntry error={errors.password} />
        <TextField label="Confirm password" value={form.confirmPassword} onChangeText={set('confirmPassword')} placeholder="Type it again"
          secureTextEntry error={errors.confirmPassword} />

        <View style={{ gap: spacing.sm }}>
          <Text style={styles.label}>I am a…</Text>
          <View style={styles.roles}>
            {ROLE_OPTIONS.map((r) => (
              <Chip key={r.value} label={r.label} selected={form.role === r.value} onPress={() => set('role')(r.value)} />
            ))}
          </View>
          {errors.role ? <Text style={styles.error}>{errors.role}</Text> : null}
        </View>

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}
        <PrimaryButton title="Create account" onPress={handleRegister} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  roles: { flexDirection: 'row', gap: spacing.sm },
  error: { fontSize: 12.5, color: colors.error },
  formError: { backgroundColor: colors.errorSoft, color: colors.error, padding: spacing.md, borderRadius: radius, fontSize: 14 },
});
