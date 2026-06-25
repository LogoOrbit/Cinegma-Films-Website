import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../theme';
import { api } from '../api';
import PageHeader from '../components/PageHeader';

export default function MediaLibraryScreen() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const list = await api('/api/media-list');
      setMedia(list);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, []));

  const copyUrl = async (url) => {
    await Clipboard.setStringAsync(url);
    Alert.alert('Copied', 'URL copied to clipboard');
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => copyUrl(item.url)}
    >
      {item.type === 'image' ? (
        <Image source={{ uri: item.url }} style={styles.img} />
      ) : (
        <View style={styles.vidPh}>
          <Text style={styles.vidIcon}>🎬</Text>
        </View>
      )}
      <View style={styles.overlay}>
        <Text style={styles.name} numberOfLines={1}>{item.name || 'untitled'}</Text>
        {item.caption ? <Text style={styles.caption} numberOfLines={1}>{item.caption}</Text> : null}
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
        data={media}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.gold}
          />
        }
        ListHeaderComponent={
          <PageHeader
            kicker="Assets"
            title="Media Library"
            desc="Tap any item to copy its URL."
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyDesc}>Upload an image to start your library.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  list: { padding: 16, paddingBottom: 40 },
  row: { gap: 12, marginBottom: 12 },
  card: {
    flex: 1, aspectRatio: 1, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panelSolid,
  },
  img: { width: '100%', height: '100%', resizeMode: 'cover' },
  vidPh: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#17171b',
  },
  vidIcon: { fontSize: 30 },
  overlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 10, backgroundColor: 'rgba(0,0,0,0.7)',
  },
  name: { fontSize: 11, color: '#fff' },
  caption: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontFamily: 'serif', fontSize: 22, color: colors.txt, marginBottom: 8 },
  emptyDesc: { color: colors.mut, fontSize: 14 },
});
