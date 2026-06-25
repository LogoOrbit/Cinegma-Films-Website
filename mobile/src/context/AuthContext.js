import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSession, saveSession, clearSession, login as apiLogin, api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const s = await getSession();
        if (s.token) {
          const me = await api('/api/auth', {
            method: 'POST',
            body: JSON.stringify({ action: 'me' }),
          });
          setUser({ token: s.token, role: me.role, username: me.username });
          await saveSession(s.token, me.role, me.username);
        }
      } catch (_) {
        await clearSession();
      }
      setLoading(false);
    })();
  }, []);

  const login = async (username, password) => {
    const d = await apiLogin(username, password);
    setUser({ token: d.token, role: d.role, username: d.username });
  };

  const logout = async () => {
    await clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
