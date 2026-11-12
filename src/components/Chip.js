import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, spacing } from '../theme';

/** Small toggle button used for filters and role selection. */
export default function Chip({ label, selected, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.selected]}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 99,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { fontSize: 13, color: colors.text, fontWeight: '500' },
  selectedText: { color: '#fff', fontWeight: '600' },
});
