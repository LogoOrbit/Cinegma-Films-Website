import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import { setBaseUrl, getBaseUrl } from '../api';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [serverUrl, setServerUrl] = useState('');

  useEffect(() => {
    setServerUrl(getBaseUrl());
  }, []);

  const saveUrl = async () => {
    const url = serverUrl.replace(/\/$/, '').trim();
    if (!url) {
      Alert.alert('Error', 'Enter your server URL');
      return;
    }
    setBaseUrl(url);
    await SecureStore.setItemAsync('cms_server_url', url);
    Alert.alert('Saved', 'Server URL updated. Sign in again if needed.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PageHeader kicker="Config" title="Settings" />

      <GlassCard style={{ marginBottom: 20 }}>
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.username || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.username}>{user?.username || '—'}</Text>
            <Text style={styles.role}>{user?.role || '—'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </GlassCard>

      <GlassCard>
        <Text style={styles.label}>SERVER URL</Text>
        <TextInput
          style={styles.input}
          value={serverUrl}
          onChangeText={setServerUrl}
          placeholder="https://your-site.vercel.app"
          placeholderTextColor={colors.faint}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <Text style={styles.hint}>
          The base URL of your Cinegma Films website where the API is hosted.
        </Text>
        <TouchableOpacity style={styles.saveBtn} onPress={saveUrl}>
          <Text style={styles.saveBtnText}>Save URL</Text>
        </TouchableOpacity>
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  content: { padding: 20, paddingBottom: 60 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.goldBright, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#111', fontSize: 18, fontWeight: '700' },
  username: { fontSize: 16, fontWeight: '600', color: colors.txt },
  role: { fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.gold, marginTop: 2 },
  logoutBtn: {
    borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  logoutText: { color: colors.err, fontSize: 13 },
  label: { fontSize: 10, letterSpacing: 2, color: colors.faint, marginBottom: 8 },
  input: {
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.lineStrong,
    borderRadius: 11, padding: 14, color: colors.txt, fontSize: 15,
  },
  hint: { fontSize: 12, color: colors.faint, marginTop: 8, lineHeight: 18 },
  saveBtn: {
    backgroundColor: colors.goldBright, borderRadius: 999,
    paddingVertical: 13, alignItems: 'center', marginTop: 18,
  },
  saveBtnText: { color: '#111', fontWeight: '600', fontSize: 14 },
});
