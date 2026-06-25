import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function Toast({ message, type = 'ok', onDone }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onDone?.());
  }, []);

  return (
    <Animated.View style={[styles.toast, type === 'ok' ? styles.ok : styles.err, { opacity }]}>
      <Text style={[styles.dot, { backgroundColor: type === 'ok' ? colors.ok : colors.err }]} />
      <Text style={[styles.text, { color: type === 'ok' ? colors.ok : colors.err }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', bottom: 30, right: 16, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 14, paddingHorizontal: 20,
    borderRadius: 999, zIndex: 999,
  },
  ok: { backgroundColor: 'rgba(20,30,24,0.95)', borderWidth: 1, borderColor: 'rgba(95,207,138,0.4)' },
  err: { backgroundColor: 'rgba(34,18,17,0.95)', borderWidth: 1, borderColor: 'rgba(255,27,28,0.4)' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontSize: 14, fontWeight: '500' },
});
