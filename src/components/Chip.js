import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, font, spacing } from '../theme';

/** Toggle used for filters and choices. Selected = black. */
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
  chip: { paddingHorizontal: spacing.sm + 4, paddingVertical: spacing.xs + 2, borderWidth: 1, borderColor: colors.line },
  selected: { backgroundColor: colors.text },
  text: { fontSize: font.small + 1, color: colors.text },
  selectedText: { color: colors.background },
});
