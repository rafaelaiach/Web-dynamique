// Keeps the logged-in user for the whole app. The navigator reads user.role
// to decide which tabs to show.

import { createContext, useContext, useMemo, useState } from 'react';
import * as AuthService from '../services/AuthService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const value = useMemo(() => ({
    user,
    async login(email, password) {
      const u = await AuthService.login(email, password);
      setUser(u);
      return u;
    },
    async register(data) {
      const u = await AuthService.register(data);
      setUser(u);
      return u;
    },
    logout() {
      setUser(null);
    },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
