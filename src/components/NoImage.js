import { StyleSheet, Text, View } from 'react-native';
import { colors, font } from '../theme';

// Mocked property image (the brief allows mocked images).
export default function NoImage({ style }) {
  return (
    <View style={[styles.box, style]}>
      <Text style={styles.text}>No image</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderColor: colors.faint, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  text: { fontSize: font.small, color: colors.muted },
});
