import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

/** variant: "primary" or "outline" */
export default function PrimaryButton({ title, onPress, loading, disabled, variant = 'primary', style }) {
  const outline = variant === 'outline';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.btn, outline && styles.outline, disabled && { opacity: 0.4 }, style]}
    >
      {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.text}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { backgroundColor: '#DDDDDD', borderWidth: 1, borderColor: '#000', paddingVertical: 8, alignItems: 'center' },
  outline: { backgroundColor: '#FFFFFF' },
  text: { color: '#000', fontSize: 14 },
});
