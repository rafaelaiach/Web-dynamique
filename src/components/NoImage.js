import { StyleSheet, Text, View } from 'react-native';

// Mocked property image (the brief allows mocked images).
export default function NoImage({ style }) {
  return (
    <View style={[styles.box, style]}>
      <Text style={styles.text}>No image</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#CCCCCC', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 11, color: '#555555' },
});
