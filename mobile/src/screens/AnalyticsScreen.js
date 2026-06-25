import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme';
import { api } from '../api';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import GlassCard from '../components/GlassCard';

function BarList({ data }) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const top = sorted[0]?.[1] || 1;
  return sorted.map(([name, count]) => (
    <View key={name} style={styles.barItem}>
      <Text style={styles.barName} numberOfLines={1}>{name}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.round((count / top) * 100)}%` }]} />
      </View>
      <Text style={styles.barCount}>{count}</Text>
    </View>
  ));
}

export default function AnalyticsScreen() {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [s, feed] = await Promise.all([
        api('/api/site-activity?action=stats').catch(() => null),
        api('/api/site-activity?limit=100').catch(() => ({ data: [], total: 0 })),
      ]);
      setStats(s);
      setEvents(feed.data || []);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, []));

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.gold} size="large" style={{ marginTop: 100 }} />
      </View>
    );
  }

  const pageCounts = {};
  const browserCounts = {};
  const deviceCounts = {};
  const eventCounts = {};
  events.forEach((e) => {
    if (e.event === 'page_view') pageCounts[e.page] = (pageCounts[e.page] || 0) + 1;
    if (e.browser) browserCounts[e.browser] = (browserCounts[e.browser] || 0) + 1;
    if (e.device) deviceCounts[e.device] = (deviceCounts[e.device] || 0) + 1;
    eventCounts[e.event] = (eventCounts[e.event] || 0) + 1;
  });

  const fmtTime = (d) =>
    new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />
      }
    >
      <PageHeader kicker="Intelligence" title="Site Analytics" desc="Visitor analytics — views, devices, referrers." />

      {stats && (
        <View style={styles.statsGrid}>
          <StatCard value={stats.views_today} label="Views Today" />
          <StatCard value={stats.visitors_today} label="Visitors Today" />
          <StatCard value={stats.views_week} label="Views This Week" />
        </View>
      )}

      {Object.keys(pageCounts).length > 0 && (
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Top Pages</Text>
          <BarList data={pageCounts} />
        </GlassCard>
      )}

      {Object.keys(eventCounts).length > 0 && (
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Event Types</Text>
          <BarList data={eventCounts} />
        </GlassCard>
      )}

      {Object.keys(browserCounts).length > 0 && (
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Browsers</Text>
          <BarList data={browserCounts} />
        </GlassCard>
      )}

      {Object.keys(deviceCounts).length > 0 && (
        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Devices</Text>
          <BarList data={deviceCounts} />
        </GlassCard>
      )}

      <GlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Live Feed</Text>
        {events.slice(0, 30).map((e, i) => (
          <View key={i} style={styles.feedItem}>
            <Text style={styles.feedTime}>{fmtTime(e.created_at)}</Text>
            <View style={styles.feedPill}>
              <Text style={styles.feedEvent}>{e.event?.replace(/_/g, ' ')}</Text>
            </View>
            <Text style={styles.feedPage} numberOfLines={1}>{e.page}</Text>
          </View>
        ))}
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  content: { padding: 20, paddingBottom: 60 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  section: { marginBottom: 16 },
  sectionTitle: { fontFamily: 'serif', fontSize: 18, color: colors.txt, marginBottom: 14 },
  barItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  barName: { flex: 1, fontSize: 13, color: colors.txt },
  barTrack: { flex: 2, height: 6, backgroundColor: 'rgba(240,236,228,0.06)', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3, backgroundColor: colors.gold },
  barCount: { fontSize: 13, color: colors.goldBright, fontWeight: '500', minWidth: 30, textAlign: 'right' },
  feedItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  feedTime: { fontSize: 11, color: colors.faint, width: 80 },
  feedPill: { backgroundColor: 'rgba(154,130,255,0.12)', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999 },
  feedEvent: { fontSize: 10, color: '#9a82ff', textTransform: 'capitalize' },
  feedPage: { flex: 1, fontSize: 12, color: colors.mut },
});
