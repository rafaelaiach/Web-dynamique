import { Pressable, StyleSheet, Text } from 'react-native';

/** Small toggle button used for filters and role selection. */
export default function Chip({ label, selected, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.selected]}
    >
      <Text style={selected ? styles.selectedText : styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#999' },
  selected: { borderColor: '#000', borderWidth: 2 },
  text: { fontSize: 13 },
  selectedText: { fontSize: 13, fontWeight: 'bold' },
});
