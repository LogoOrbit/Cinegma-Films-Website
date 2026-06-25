import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function StatCard({ value, label }) {
  return (
    <View style={styles.card}>
      <Text style={styles.num}>{value}</Text>
      <Text style={styles.lbl}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.panelSolid,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 18,
  },
  num: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.goldBright,
    letterSpacing: 1,
  },
  lbl: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.faint,
    marginTop: 6,
  },
});
