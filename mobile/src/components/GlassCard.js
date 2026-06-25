import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function GlassCard({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panelSolid,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 20,
  },
});
