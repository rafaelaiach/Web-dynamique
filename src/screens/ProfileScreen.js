// Shared by all roles: who is logged in, and the log-out button.

import { StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { colors, spacing } from '../theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.name}>{user.fullName}</Text>
        <Text style={styles.role}>{user.role}</Text>
        <Text style={styles.detail}>{user.email}</Text>
        {user.phone ? <Text style={styles.detail}>{user.phone}</Text> : null}
      </View>
      <PrimaryButton title="Log out" variant="outline" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.lg },
  card: { borderWidth: 1, borderColor: '#999', padding: 12, gap: 3 },
  name: { fontSize: 18, fontWeight: 'bold' },
  role: { fontSize: 13 },
  detail: { fontSize: 14, color: colors.muted },
});
