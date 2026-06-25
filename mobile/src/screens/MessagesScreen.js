import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Linking,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme';
import { api } from '../api';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Pill from '../components/Pill';

export default function MessagesScreen() {
  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await api('/api/contact?limit=100');
      setMessages(res.data || []);
      setTotal(res.total || 0);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, []));

  const markRead = async (id) => {
    try {
      await api('/api/contact', { method: 'PUT', body: JSON.stringify({ id, read: true }) });
      load();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const fmtDate = (d) => {
    const dt = new Date(d);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' · ' + dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const unread = messages.filter(m => !m.read).length;

  const renderMessage = ({ item }) => (
    <View style={[styles.card, !item.read && styles.cardUnread]}>
      <View style={styles.header}>
        <Text style={styles.name}>{item.name}</Text>
        <TouchableOpacity onPress={() => Linking.openURL(`mailto:${item.email}`)}>
          <Text style={styles.email}>{item.email}</Text>
        </TouchableOpacity>
        {item.inquiry ? <Pill variant="cat">{item.inquiry}</Pill> : null}
      </View>
      <Text style={styles.time}>{fmtDate(item.created_at)}</Text>
      <Text style={styles.message}>{item.message}</Text>
      <View style={styles.actions}>
        {!item.read ? (
          <TouchableOpacity style={styles.actionBtn} onPress={() => markRead(item.id)}>
            <Text style={styles.actionText}>Mark as read</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.readLabel}>✓ Read</Text>
        )}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => Linking.openURL(
            `mailto:${item.email}?subject=${encodeURIComponent('Re: ' + (item.inquiry || 'Your inquiry') + ' — Cinegma Films')}`
          )}
        >
          <Text style={styles.actionText}>Reply via Email</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />
        }
        ListHeaderComponent={
          <>
            <PageHeader kicker="Inbox" title="Messages" desc="Every message from the contact form." />
            <View style={styles.stats}>
              <StatCard value={total} label="Total" />
              <StatCard value={unread} label="Unread" />
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyDesc}>Messages from the contact form will appear here.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  list: { padding: 20, paddingBottom: 40 },
  stats: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  card: {
    backgroundColor: colors.panelSolid, borderWidth: 1, borderColor: colors.line,
    borderRadius: 16, padding: 20, marginBottom: 16,
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: colors.goldBright, backgroundColor: 'rgba(200,200,200,0.04)' },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 6 },
  name: { fontSize: 16, fontWeight: '600', color: colors.txt },
  email: { fontSize: 13, color: colors.gold },
  time: { fontSize: 11, color: colors.faint, marginBottom: 12 },
  message: { fontSize: 14, color: colors.txt, lineHeight: 22, marginBottom: 14 },
  actions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  actionBtn: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999,
    borderWidth: 1, borderColor: colors.lineStrong,
  },
  actionText: { color: colors.txt, fontSize: 12 },
  readLabel: { fontSize: 12, color: colors.ok },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontFamily: 'serif', fontSize: 22, color: colors.txt, marginBottom: 8 },
  emptyDesc: { color: colors.mut, fontSize: 14 },
});
