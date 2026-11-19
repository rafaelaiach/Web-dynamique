import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, font, spacing } from '../theme';

/** variant "primary" = black, "outline" = white with a black border. */
export default function PrimaryButton({ title, onPress, loading, disabled, variant = 'primary', style }) {
  const outline = variant === 'outline';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.btn, outline && styles.outline, (disabled || pressed) && styles.dim, style]}
    >
      {loading
        ? <ActivityIndicator color={outline ? colors.text : colors.background} />
        : <Text style={[styles.text, outline && styles.outlineText]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { backgroundColor: colors.text, borderWidth: 1, borderColor: colors.text, paddingVertical: spacing.sm + 4, alignItems: 'center' },
  outline: { backgroundColor: colors.background },
  dim: { opacity: 0.4 },
  text: { color: colors.background, fontSize: font.body },
  outlineText: { color: colors.text },
});
