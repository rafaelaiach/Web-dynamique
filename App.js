import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { getDb } from './src/db/database';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState('');

  // Open the database (and create tables + demo data) before showing any screen.
  useEffect(() => {
    getDb().then(() => setDbReady(true)).catch((e) => setDbError(e.message));
  }, []);

  if (!dbReady) {
    return (
      <View style={styles.center}>
        {dbError ? (
          <Text style={styles.error}>Could not open the database: {dbError}</Text>
        ) : (
          <>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.text}>Opening database…</Text>
          </>
        )}
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: colors.background },
  text: { color: colors.muted },
  error: { color: colors.error, textAlign: 'center' },
});
