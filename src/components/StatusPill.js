import { Text } from 'react-native';
import { colors } from '../theme';

export default function StatusPill({ status }) {
  const s = colors.status[status] || colors.status.draft;
  return <Text style={{ fontSize: 12, marginTop: 2 }}>Status: {s.label}</Text>;
}
