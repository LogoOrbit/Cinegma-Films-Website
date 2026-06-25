import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function PageHeader({ kicker, title, desc }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.kicker}>{kicker}</Text>
      <Text style={styles.title}>{title}</Text>
      {desc ? <Text style={styles.desc}>{desc}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 24 },
  kicker: {
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.gold,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 30,
    fontWeight: '500',
    color: colors.txt,
    letterSpacing: 0.3,
  },
  desc: {
    color: colors.mut,
    fontSize: 14,
    marginTop: 8,
    lineHeight: 22,
  },
});
