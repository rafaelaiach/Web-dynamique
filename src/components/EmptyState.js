import { StyleSheet, Text, View } from 'react-native';
import { colors, font, spacing } from '../theme';

export default function EmptyState({ title, message }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: spacing.lg, gap: spacing.xs },
  title: { fontSize: font.body, color: colors.text },
  message: { fontSize: font.small, color: colors.muted },
});
