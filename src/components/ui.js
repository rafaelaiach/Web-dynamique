// Shared building blocks. Every screen is made from these, so the app looks the same everywhere.

import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, font, spacing } from '../theme';

/** Scrolling white page with the standard padding. */
export function Screen({ children, onRefresh, style }) {
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, style]}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={false} onRefresh={onRefresh} /> : undefined}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Padded block inside a Screen whose own padding was removed (e.g. under a full-width photo). */
Screen.Body = function ScreenBody({ children }) {
  return <View style={styles.body}>{children}</View>;
};

export function Title({ children }) {
  return <Text style={styles.title}>{children}</Text>;
}

/** Small uppercase heading with a line under it. */
export function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

export function P({ children, style, onPress }) {
  return <Text style={[styles.p, onPress && styles.link, style]} onPress={onPress}>{children}</Text>;
}

export function Muted({ children, style }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

export function ErrorText({ children }) {
  return children ? <Text style={styles.error}>{children}</Text> : null;
}

export function Row({ children, style }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

/** A line of the list: content separated by a thin rule underneath. */
export function Item({ children }) {
  return <View style={styles.item}>{children}</View>;
}

/** "Label ........ value" line. */
export function KeyValue({ label, value }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.p}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.lg * 2 },
  body: { paddingHorizontal: spacing.md, gap: spacing.md },
  title: { fontSize: font.title, color: colors.text },
  section: { gap: spacing.sm, marginTop: spacing.sm },
  heading: {
    fontSize: font.heading, color: colors.text, letterSpacing: 1,
    borderBottomWidth: 1, borderColor: colors.line, paddingBottom: spacing.xs,
  },
  p: { fontSize: font.body, color: colors.text },
  link: { textDecorationLine: 'underline' },
  muted: { fontSize: font.small, color: colors.muted },
  error: { fontSize: font.small, color: colors.text, textDecorationLine: 'underline' },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', flexWrap: 'wrap' },
  item: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.faint, gap: spacing.xs },
  kv: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  kvValue: { fontSize: font.body, color: colors.text },
});
