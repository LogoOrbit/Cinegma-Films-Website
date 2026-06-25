import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';
import Pill from '../components/Pill';

const ROLES = ['user', 'admin', 'owner'];

export default function AdminsScreen() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newRole, setNewRole] = useState('user');

  const load = async () => {
    try {
      const list = await api('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'list' }),
      });
      setAdmins(list);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, []));

  const addAdmin = async () => {
    if (!newUser.trim() || !newPass) {
      Alert.alert('Error', 'Username and password required');
      return;
    }
    try {
      await api('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'create', username: newUser.trim(), password: newPass, role: newRole }),
      });
      setNewUser('');
      setNewPass('');
      load();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const deleteAdmin = (id, name) => {
    Alert.alert('Remove Admin', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await api('/api/auth', {
              method: 'POST',
              body: JSON.stringify({ action: 'delete', id }),
            });
            load();
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const renderAdmin = ({ item }) => (
    <View style={styles.adminRow}>
      <View style={styles.adminInfo}>
        <Text style={styles.adminName}>{item.username}</Text>
        <Pill variant={item.role === 'owner' ? 'cat' : 'draft'}>{item.role}</Pill>
        <Text style={styles.adminDate}>{fmtDate(item.created_at)}</Text>
      </View>
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => deleteAdmin(item.id, item.username)}
      >
        <Text style={styles.removeBtnText}>Remove</Text>
      </TouchableOpacity>
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
        data={admins}
        keyExtractor={(item) => item.id}
        renderItem={renderAdmin}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />
        }
        ListHeaderComponent={
          <>
            <PageHeader kicker="Team" title="Admins" desc="Add or remove people who can sign in." />

            {/* Owner row */}
            <View style={[styles.adminRow, { marginBottom: 20 }]}>
              <View style={styles.adminInfo}>
                <Text style={styles.adminName}>{user?.username}</Text>
                <Pill variant="cat">Owner (you)</Pill>
              </View>
              <Text style={styles.protectedText}>Protected</Text>
            </View>

            {/* Add form */}
            <GlassCard style={{ marginBottom: 24 }}>
              <Text style={styles.label}>NEW USERNAME</Text>
              <TextInput
                style={styles.input}
                value={newUser}
                onChangeText={setNewUser}
                placeholder="e.g. editor1"
                placeholderTextColor={colors.faint}
                autoCapitalize="none"
              />
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                value={newPass}
                onChangeText={setNewPass}
                placeholder="Set a password"
                placeholderTextColor={colors.faint}
              />
              <Text style={styles.label}>ROLE</Text>
              <View style={styles.roleRow}>
                {ROLES.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleBtn, newRole === r && styles.roleBtnActive]}
                    onPress={() => setNewRole(r)}
                  >
                    <Text style={[styles.roleText, newRole === r && styles.roleTextActive]}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={addAdmin} activeOpacity={0.8}>
                <Text style={styles.addBtnText}>+ Add Admin</Text>
              </TouchableOpacity>
            </GlassCard>
          </>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No additional admins yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  list: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 10, letterSpacing: 2, color: colors.faint, marginBottom: 8, marginTop: 14 },
  input: {
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.lineStrong,
    borderRadius: 11, padding: 14, color: colors.txt, fontSize: 15,
  },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 999,
    borderWidth: 1, borderColor: colors.lineStrong, alignItems: 'center',
  },
  roleBtnActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  roleText: { color: colors.mut, fontSize: 13 },
  roleTextActive: { color: '#111', fontWeight: '500' },
  addBtn: {
    backgroundColor: colors.goldBright, borderRadius: 999,
    paddingVertical: 13, alignItems: 'center', marginTop: 20,
  },
  addBtnText: { color: '#111', fontWeight: '600', fontSize: 14 },
  adminRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.panelSolid, borderWidth: 1, borderColor: colors.line,
    borderRadius: 14, padding: 16, marginBottom: 10,
  },
  adminInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, flexWrap: 'wrap' },
  adminName: { fontSize: 15, fontWeight: '600', color: colors.txt },
  adminDate: { fontSize: 11, color: colors.faint },
  removeBtn: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999,
    backgroundColor: 'rgba(255,27,28,0.12)', borderWidth: 1, borderColor: 'rgba(255,27,28,0.35)',
  },
  removeBtnText: { color: colors.err, fontSize: 12, fontWeight: '500' },
  protectedText: { fontSize: 12, color: colors.faint },
  emptyText: { color: colors.mut, fontSize: 14, textAlign: 'center', paddingVertical: 30 },
});
