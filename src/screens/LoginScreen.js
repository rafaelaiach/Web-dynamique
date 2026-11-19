// Week 2 requirement: first user input (email + password), checked against the database.

import { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Chip from '../components/Chip';
import PrimaryButton from '../components/PrimaryButton';
import TextField from '../components/TextField';
import { ErrorText, Muted, P, Row, Screen, Section, styles as ui } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { getDatabaseInfo } from '../db/database';
import { DEMO_PASSWORD } from '../db/seed';
import { validateLogin } from '../services/AuthService';

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

  return (
    <SafeAreaView style={ui.flex}>
      <Screen style={{ paddingTop: 48 }}>
        <Text style={[ui.title, { fontSize: 28 }]}>City Estate</Text>
        <Muted>Buy, sell and rent property.</Muted>

        <TextField label="Email" value={email} onChangeText={setEmail} placeholder="name@example.com"
          keyboardType="email-address" autoCapitalize="none" autoCorrect={false} error={errors.email} />
        <TextField label="Password" value={password} onChangeText={setPassword} placeholder="Password"
          secureTextEntry error={errors.password} onSubmitEditing={handleLogin} />
        <ErrorText>{formError}</ErrorText>
        <PrimaryButton title="Log in" onPress={handleLogin} loading={loading} />
        <Pressable onPress={() => navigation.navigate('Register')}>
          <P style={{ textDecorationLine: 'underline' }}>Create an account</P>
        </Pressable>

        <Section title="Demo accounts">
          <Muted>Password: {DEMO_PASSWORD}</Muted>
          <Row>
            {DEMO_ACCOUNTS.map((a) => (
              <Chip key={a.role} label={a.role} selected={email === a.email}
                onPress={() => { setEmail(a.email); setPassword(DEMO_PASSWORD); setErrors({}); setFormError(''); }} />
            ))}
          </Row>
        </Section>

        <Muted>
          {dbError
            ? `Database error: ${dbError}`
            : dbInfo
              ? `Connected to ${dbInfo.name} · ${dbInfo.tables.length} tables · ${dbInfo.properties} properties`
              : 'Connecting to database…'}
        </Muted>
      </Screen>
    </SafeAreaView>
  );
}
