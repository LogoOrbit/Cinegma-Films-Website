import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme';
import { api } from '../api';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Pill from '../components/Pill';

export default function ArticlesScreen({ navigation }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await api('/api/articles?drafts=1');
      setArticles(data);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, []));

  const pub = articles.filter(a => a.published).length;

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const renderArticle = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('EditArticle', { id: item.id })}
    >
      <View style={styles.cover}>
        {item.cover_image_url ? (
          <Image source={{ uri: item.cover_image_url }} style={styles.coverImg} />
        ) : (
          <Text style={styles.coverPh}>No Cover</Text>
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.row}>
          <Pill variant={item.published ? 'ok' : 'draft'}>
            {item.published ? 'Live' : 'Draft'}
          </Pill>
          {item.category ? (
            <Pill variant="cat">{item.category.replace(/-/g, ' ')}</Pill>
          ) : null}
        </View>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.date}>
          {fmtDate(item.created_at)}
          {item.author ? ` · by ${item.author}` : ''}
        </Text>
      </View>
    </TouchableOpacity>
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
        data={articles}
        keyExtractor={(item) => item.id}
        renderItem={renderArticle}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.gold}
          />
        }
        ListHeaderComponent={
          <>
            <PageHeader kicker="Editorial" title="Articles" desc="Write, publish and manage your blog." />
            <View style={styles.stats}>
              <StatCard value={articles.length} label="Total" />
              <StatCard value={pub} label="Published" />
              <StatCard value={articles.length - pub} label="Drafts" />
            </View>
            <TouchableOpacity
              style={styles.newBtn}
              onPress={() => navigation.navigate('EditArticle', {})}
              activeOpacity={0.8}
            >
              <Text style={styles.newBtnText}>+ New Article</Text>
            </TouchableOpacity>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Your story starts here</Text>
            <Text style={styles.emptyDesc}>Create your first article.</Text>
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
  newBtn: {
    backgroundColor: colors.goldBright,
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 24,
  },
  newBtnText: { color: '#111', fontWeight: '600', fontSize: 14 },
  card: {
    backgroundColor: colors.panelSolid,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 18,
  },
  cover: {
    aspectRatio: 16 / 10,
    backgroundColor: '#17171b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverPh: { color: colors.faint, fontSize: 14 },
  body: { padding: 16 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  title: { fontFamily: 'serif', fontSize: 20, fontWeight: '500', color: colors.txt, marginBottom: 6 },
  date: { fontSize: 12, color: colors.faint },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontFamily: 'serif', fontSize: 22, color: colors.txt, marginBottom: 8 },
  emptyDesc: { color: colors.mut, fontSize: 14 },
});
