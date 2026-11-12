// Week 2 requirement: first user input (email + password), checked against the database.

import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PrimaryButton from '../components/PrimaryButton';
import TextField from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { getDatabaseInfo } from '../db/database';
import { DEMO_PASSWORD } from '../db/seed';
import { validateLogin } from '../services/AuthService';
import { colors, radius, spacing } from '../theme';

const DEMO_ACCOUNTS = [
  { role: 'Buyer', email: 'buyer@cityestate.com' },
  { role: 'Seller', email: 'seller@cityestate.com' },
  { role: 'Agent', email: 'agent@cityestate.com' },
];

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbInfo, setDbInfo] = useState(null);
  const [dbError, setDbError] = useState('');

  // Shows that the database connection works (Week 2 requirement).
  useEffect(() => {
    getDatabaseInfo().then(setDbInfo).catch((e) => setDbError(e.message));
  }, []);

  async function handleLogin() {
    setFormError('');
    const found = validateLogin({ email, password });
    setErrors(found);
    if (Object.keys(found).length) return;
    setLoading(true);
    try {
      await login(email, password);
    } catch (e) {
      setFormError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function fillDemoAccount(account) {
    setEmail(account.email);
    setPassword(DEMO_PASSWORD);
    setErrors({});
    setFormError('');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logo}><Text style={styles.logoText}>CE</Text></View>
            <Text style={styles.title}>City Estate</Text>
            <Text style={styles.subtitle}>Buy, sell and rent property</Text>
          </View>

          <View style={styles.form}>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              secureTextEntry
              error={errors.password}
              onSubmitEditing={handleLogin}
            />
            {formError ? <Text style={styles.formError}>{formError}</Text> : null}
            <PrimaryButton title="Log in" onPress={handleLogin} loading={loading} />
            <Pressable onPress={() => navigation.navigate('Register')} style={styles.link}>
              <Text style={styles.linkText}>No account? <Text style={styles.linkBold}>Register</Text></Text>
            </Pressable>
          </View>

          <View style={styles.demo}>
            <Text style={styles.demoTitle}>Demo accounts (password: {DEMO_PASSWORD})</Text>
            <View style={styles.demoRow}>
              {DEMO_ACCOUNTS.map((a) => (
                <Pressable key={a.role} onPress={() => fillDemoAccount(a)} style={styles.demoBtn}>
                  <Text style={styles.demoBtnText}>{a.role}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Text style={[styles.db, dbError && { color: colors.error }]}>
            {dbError
              ? `Database error: ${dbError}`
              : dbInfo
                ? `● Connected to ${dbInfo.name} · ${dbInfo.tables.length} tables · ${dbInfo.properties} properties`
                : 'Connecting to database…'}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xl },
  header: { alignItems: 'center', gap: spacing.xs },
  logo: { width: 56, height: 56, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  logoText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 15, color: colors.muted },
  form: { gap: spacing.lg },
  formError: { backgroundColor: colors.errorSoft, color: colors.error, padding: spacing.md, borderRadius: radius, fontSize: 14 },
  link: { alignItems: 'center', paddingVertical: spacing.xs },
  linkText: { color: colors.muted, fontSize: 14 },
  linkBold: { color: colors.primary, fontWeight: '700' },
  demo: { gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.lg },
  demoTitle: { fontSize: 12.5, color: colors.muted, textAlign: 'center' },
  demoRow: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  demoBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 99, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  demoBtnText: { fontSize: 13, fontWeight: '600', color: colors.text },
  db: { textAlign: 'center', fontSize: 12, color: '#15803D' },
});
