// Agent home: the three statistics from the brief, read from the database,
// plus the properties this agent manages.

import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import PropertyCard from '../components/PropertyCard';
import { useAuth } from '../context/AuthContext';
import { getPropertiesForAgent } from '../services/PropertyService';
import { getAgentStats } from '../services/StatsService';
import { colors, formatPrice, radius, spacing } from '../theme';

function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function AgentDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [managed, setManaged] = useState([]);

  const load = useCallback(async () => {
    const [s, m] = await Promise.all([getAgentStats(), getPropertiesForAgent(user.id)]);
    setStats(s);
    setManaged(m);
  }, [user.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!stats) return <View style={styles.screen} />;

  const avg = (type) => stats.averagePrice.find((a) => a.listing_type === type);
  const maxOffers = Math.max(1, ...stats.offerCounts.map((o) => o.total_offers));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
    >
      <Text style={styles.welcome}>Welcome back, {user.fullName.split(' ')[0]}</Text>

      <View style={styles.grid}>
        <Stat value={stats.totalActive} label="Active listings" />
        <Stat value={stats.awaitingReview} label="Drafts to review" />
        <Stat value={avg('sale') ? formatPrice(avg('sale').avg_price, 'sale') : '–'} label="Average sale price" />
        <Stat value={avg('rent') ? formatPrice(avg('rent').avg_price, 'rent') : '–'} label="Average rent" />
      </View>

      <View style={styles.panel}>
        <Text style={styles.h2}>Offers per property</Text>
        {stats.offerCounts.map((o) => (
          <View key={o.property_id} style={styles.barRow}>
            <Text style={styles.barLabel} numberOfLines={1}>{o.title}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.bar, { width: `${(o.total_offers / maxOffers) * 100}%` }]} />
            </View>
            <Text style={styles.barValue}>{o.total_offers}</Text>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.h2}>Active listings per user</Text>
        {stats.activePerUser.map((u) => (
          <View key={u.user_id} style={styles.userRow}>
            <Text style={styles.userName}>{u.full_name}</Text>
            <Text style={styles.userRole}>{u.role}</Text>
            <Text style={styles.userCount}>{u.active_listings}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.h2}>Properties I manage ({managed.length})</Text>
      <View style={{ gap: spacing.md }}>
        {managed.map((p) => (
          <PropertyCard key={p.id} property={p} onPress={() => navigation.navigate('PropertyDetail', { id: p.id })} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl * 2 },
  welcome: { fontSize: 15, color: colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  stat: { flexBasis: '47%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: 2 },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 13, color: colors.muted },
  panel: { backgroundColor: colors.card, borderRadius: radius, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.md },
  h2: { fontSize: 16, fontWeight: '700', color: colors.text },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barLabel: { width: 120, fontSize: 13, color: colors.text },
  barTrack: { flex: 1, height: 10, backgroundColor: colors.background, borderRadius: 5, overflow: 'hidden' },
  bar: { height: 10, backgroundColor: colors.primary, borderRadius: 5 },
  barValue: { width: 20, textAlign: 'right', fontWeight: '700', color: colors.text },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  userName: { flex: 1, fontSize: 14, color: colors.text },
  userRole: { fontSize: 12, color: colors.muted, textTransform: 'capitalize' },
  userCount: { width: 24, textAlign: 'right', fontWeight: '700', color: colors.text },
});
