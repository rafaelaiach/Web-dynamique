// Agent home: the three statistics from the brief, read from the database,
// plus the properties this agent manages.

import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import PropertyCard from '../components/PropertyCard';
import { KeyValue, Muted, Screen, Section } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { getPropertiesForAgent } from '../services/PropertyService';
import { getAgentStats } from '../services/StatsService';
import { capitalise, colors, font, formatPrice, spacing } from '../theme';

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

  if (!stats) return <Screen><Muted>Loading…</Muted></Screen>;

  const avg = (type) => stats.averagePrice.find((a) => a.listing_type === type);
  const maxOffers = Math.max(1, ...stats.offerCounts.map((o) => o.total_offers));

  return (
    <Screen onRefresh={load}>
      <Section title="Overview">
        <KeyValue label="Active listings" value={stats.totalActive} />
        <KeyValue label="Drafts to review" value={stats.awaitingReview} />
        <KeyValue label="Average sale price" value={avg('sale') ? formatPrice(avg('sale').avg_price, 'sale') : '–'} />
        <KeyValue label="Average rent" value={avg('rent') ? formatPrice(avg('rent').avg_price, 'rent') : '–'} />
      </Section>

      <Section title="Offers per property">
        {stats.offerCounts.map((o) => (
          <View key={o.property_id} style={styles.barRow}>
            <Text style={styles.barLabel} numberOfLines={1}>{o.title}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.bar, { width: `${(o.total_offers / maxOffers) * 100}%` }]} />
            </View>
            <Text style={styles.barValue}>{o.total_offers}</Text>
          </View>
        ))}
      </Section>

      <Section title="Active listings per user">
        {stats.activePerUser.map((u) => (
          <KeyValue key={u.user_id} label={`${u.full_name} (${capitalise(u.role)})`} value={u.active_listings} />
        ))}
      </Section>

      <Section title={`Properties I manage (${managed.length})`}>
        {managed.map((p) => (
          <PropertyCard key={p.id} property={p} onPress={() => navigation.navigate('PropertyDetail', { id: p.id })} />
        ))}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barLabel: { width: 120, fontSize: font.small + 1, color: colors.text },
  barTrack: { flex: 1, height: 8, borderWidth: 1, borderColor: colors.line },
  bar: { height: '100%', backgroundColor: colors.text },
  barValue: { width: 24, textAlign: 'right', fontSize: font.body, color: colors.text },
});
