import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme';
import { api } from '../api';
import PageHeader from '../components/PageHeader';

const PER_PAGE = 50;

export default function ActivityLogScreen() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (off = 0) => {
    try {
      const res = await api(`/api/audit-log?limit=${PER_PAGE}&offset=${off}`);
      setLogs(res.data || []);
      setTotal(res.total || 0);
      setOffset(off);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { setLoading(true); load(0); }, []));

  const fmtTime = (d) =>
    new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

  const actionColor = (action, cat) => {
    if (action.includes('delete') || action.includes('failed')) return { bg: 'rgba(255,27,28,0.12)', color: colors.err };
    if (cat === 'auth') return { bg: 'rgba(99,179,237,0.12)', color: '#63b3ed' };
    if (cat === 'media') return { bg: 'rgba(95,207,138,0.12)', color: colors.ok };
    return { bg: 'rgba(154,130,255,0.12)', color: '#9a82ff' };
  };

  const detailStr = (d) => {
    if (!d) return '';
    const parts = [];
    if (d.title) parts.push(d.title);
    if (d.filename) parts.push(d.filename);
    if (d.target_username) parts.push('User: ' + d.target_username);
    return parts.join(' · ');
  };

  const totalPages = Math.ceil(total / PER_PAGE);
  const curPage = Math.floor(offset / PER_PAGE);

  const renderLog = ({ item }) => {
    const ac = actionColor(item.action, item.category);
    return (
      <View style={styles.logItem}>
        <View style={styles.logHeader}>
          <Text style={styles.logTime}>{fmtTime(item.created_at)}</Text>
          <View style={[styles.actionPill, { backgroundColor: ac.bg }]}>
            <Text style={[styles.actionText, { color: ac.color }]}>
              {item.action.replace(/_/g, ' ')}
            </Text>
          </View>
        </View>
        <Text style={styles.logUser}>
          {item.username} <Text style={styles.logRole}>· {item.role}</Text>
        </Text>
        <Text style={styles.logDevice}>
          {[item.browser, item.os, item.device].filter(Boolean).join(' · ')}
        </Text>
        {detailStr(item.details) ? (
          <Text style={styles.logDetails} numberOfLines={2}>{detailStr(item.details)}</Text>
        ) : null}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.gold} size="large" style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={logs}
        keyExtractor={(_, i) => String(offset + i)}
        renderItem={renderLog}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(0); }} tintColor={colors.gold} />
        }
        ListHeaderComponent={
          <PageHeader kicker="Intelligence" title="Activity Log" desc="Complete audit trail of all actions." />
        }
        ListFooterComponent={
          totalPages > 1 ? (
            <View style={styles.pagination}>
              {curPage > 0 && (
                <TouchableOpacity style={styles.pageBtn} onPress={() => load(offset - PER_PAGE)}>
                  <Text style={styles.pageBtnText}>Previous</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.pageInfo}>
                Page {curPage + 1} of {totalPages} · {total} events
              </Text>
              {curPage < totalPages - 1 && (
                <TouchableOpacity style={styles.pageBtn} onPress={() => load(offset + PER_PAGE)}>
                  <Text style={styles.pageBtnText}>Next</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text style={styles.totalText}>{total} events total</Text>
          )
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No activity yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  list: { padding: 20, paddingBottom: 40 },
  logItem: {
    backgroundColor: colors.panelSolid, borderWidth: 1, borderColor: colors.line,
    borderRadius: 14, padding: 16, marginBottom: 12,
  },
  logHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  logTime: { fontSize: 11, color: colors.faint },
  actionPill: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999 },
  actionText: { fontSize: 10, fontWeight: '500', textTransform: 'capitalize' },
  logUser: { fontSize: 14, fontWeight: '600', color: colors.txt, marginBottom: 4 },
  logRole: { fontWeight: '300', color: colors.faint, fontSize: 12 },
  logDevice: { fontSize: 12, color: colors.faint, marginBottom: 4 },
  logDetails: { fontSize: 12, color: colors.mut, marginTop: 4 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 20 },
  pageBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: colors.lineStrong },
  pageBtnText: { color: colors.txt, fontSize: 12 },
  pageInfo: { fontSize: 12, color: colors.faint },
  totalText: { textAlign: 'center', fontSize: 12, color: colors.faint, paddingVertical: 20 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontFamily: 'serif', fontSize: 22, color: colors.txt },
});
