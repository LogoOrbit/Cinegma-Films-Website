import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

const variants = {
  ok: { bg: 'rgba(95,207,138,0.14)', color: colors.ok },
  draft: { bg: 'rgba(240,236,228,0.08)', color: colors.mut },
  cat: { bg: colors.goldDim, color: colors.goldBright },
  danger: { bg: 'rgba(255,27,28,0.12)', color: colors.err },
};

export default function Pill({ children, variant = 'cat' }) {
  const v = variants[variant] || variants.cat;
  return (
    <Text style={[styles.pill, { backgroundColor: v.bg, color: v.color }]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  pill: {
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    paddingVertical: 4,
    paddingHorizontal: 11,
    borderRadius: 999,
    fontWeight: '500',
    overflow: 'hidden',
  },
});
