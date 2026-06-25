import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      setError('Username and password are required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.logoWrap}>
        <Text style={styles.logoMain}>CINEGMA</Text>
        <Text style={styles.logoSub}>FILMS</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.kicker}>CONTENT STUDIO</Text>
        <Text style={styles.heading}>Sign in to continue</Text>

        <Text style={styles.label}>USERNAME</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Your username"
          placeholderTextColor={colors.faint}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>PASSWORD</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          placeholderTextColor={colors.faint}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#111" size="small" />
          ) : (
            <Text style={styles.btnText}>Enter Studio</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoWrap: { alignItems: 'center', marginBottom: 40 },
  logoMain: {
    fontFamily: 'serif',
    fontSize: 48,
    fontWeight: '700',
    color: colors.goldBright,
    letterSpacing: 8,
  },
  logoSub: {
    fontSize: 18,
    fontWeight: '300',
    color: colors.gold,
    letterSpacing: 12,
    marginTop: 2,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.panelSolid,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 30,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 3,
    color: colors.gold,
    textAlign: 'center',
    marginBottom: 6,
  },
  heading: {
    fontFamily: 'serif',
    fontSize: 22,
    fontWeight: '500',
    color: colors.txt,
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 10,
    letterSpacing: 2,
    color: colors.faint,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 11,
    padding: 14,
    color: colors.txt,
    fontSize: 15,
    marginBottom: 16,
  },
  error: {
    color: colors.err,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  btn: {
    backgroundColor: colors.goldBright,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    color: '#111',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
