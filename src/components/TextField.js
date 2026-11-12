import { StyleSheet, Text, TextInput, View } from 'react-native';

/** Text input with a label and an error message underneath. */
export default function TextField({ label, error, style, ...inputProps }) {
  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}:</Text> : null}
      <TextInput placeholderTextColor="#999" style={styles.input} {...inputProps} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, marginBottom: 2 },
  input: { borderWidth: 1, borderColor: '#999', padding: 6, fontSize: 14 },
  error: { fontSize: 12, fontStyle: 'italic', marginTop: 2 },
});
