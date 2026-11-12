import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export default function StatusPill({ status }) {
  const s = colors.status[status] || colors.status.draft;
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.fg }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 2, borderRadius: 99 },
  text: { fontSize: 11.5, fontWeight: '700' },
});
