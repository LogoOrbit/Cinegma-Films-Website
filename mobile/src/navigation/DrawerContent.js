import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { group: 'Create', items: [
    { key: 'Articles', label: 'Articles', icon: '📝' },
    { key: 'UploadImage', label: 'Upload Image', icon: '🖼️' },
    { key: 'UploadVideo', label: 'Upload Video', icon: '🎬' },
  ]},
  { group: 'Manage', items: [
    { key: 'MediaLibrary', label: 'Media Library', icon: '📁' },
    { key: 'Messages', label: 'Messages', icon: '✉️', ownerOnly: true },
    { key: 'Analytics', label: 'Site Analytics', icon: '📊', ownerOnly: true },
    { key: 'ActivityLog', label: 'Activity Log', icon: '📋', ownerOnly: true },
    { key: 'Admins', label: 'Admins', icon: '👥', ownerOnly: true },
  ]},
  { group: 'System', items: [
    { key: 'Settings', label: 'Settings', icon: '⚙️' },
  ]},
];

export default function DrawerContent({ navigation, state }) {
  const { user } = useAuth();
  const activeRoute = state?.routes[state.index]?.name;

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <Text style={styles.mark}>CINEGMA <Text style={styles.markGold}>STUDIO</Text></Text>
        <Text style={styles.sub}>CONTENT STUDIO</Text>
        <View style={styles.rule} />
      </View>

      <ScrollView style={styles.nav}>
        {NAV_ITEMS.map((group) => (
          <View key={group.group}>
            <Text style={styles.groupLabel}>{group.group}</Text>
            {group.items
              .filter((item) => !item.ownerOnly || user?.role === 'owner')
              .map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.navBtn, activeRoute === item.key && styles.navBtnActive]}
                  onPress={() => navigation.navigate(item.key)}
                >
                  <Text style={styles.navIcon}>{item.icon}</Text>
                  <Text style={[styles.navLabel, activeRoute === item.key && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        ))}
      </ScrollView>

      <View style={styles.userBox}>
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.username || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{user?.username || '—'}</Text>
            <Text style={styles.userRole}>{user?.role || '—'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(16,16,19,0.97)',
  },
  brand: { paddingTop: 56, paddingHorizontal: 24, paddingBottom: 20 },
  mark: { fontSize: 18, fontWeight: '700', letterSpacing: 4, color: colors.txt },
  markGold: { color: colors.gold },
  sub: { fontSize: 9, letterSpacing: 3, color: colors.faint, marginTop: 6 },
  rule: { height: 1, backgroundColor: colors.gold, marginTop: 16, opacity: 0.6 },
  nav: { flex: 1, paddingHorizontal: 14, paddingTop: 10 },
  groupLabel: {
    fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase',
    color: colors.faint, paddingHorizontal: 12, paddingTop: 16, paddingBottom: 8,
  },
  navBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 11,
    marginBottom: 2,
  },
  navBtnActive: {
    backgroundColor: colors.goldBright,
  },
  navIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  navLabel: { fontSize: 14, color: colors.mut },
  navLabelActive: { color: '#111', fontWeight: '600' },
  userBox: { padding: 18, borderTopWidth: 1, borderTopColor: colors.line },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.goldBright, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#111', fontWeight: '700', fontSize: 15 },
  userName: { fontSize: 14, color: colors.txt },
  userRole: { fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.gold, marginTop: 1 },
});
