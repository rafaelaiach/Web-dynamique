import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, font, spacing } from '../theme';

/** Label, underlined input, error message. */
export default function TextField({ label, error, style, multiline, ...inputProps }) {
  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, multiline && styles.multiline]}
        multiline={multiline}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { fontSize: font.small, color: colors.muted },
  input: { borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, fontSize: font.body, color: colors.text },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  error: { fontSize: font.small, color: colors.text, textDecorationLine: 'underline' },
});
