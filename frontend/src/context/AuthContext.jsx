import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  signupRequest,
  loginRequest,
  meRequest,
  updateProfileRequest,
  updatePreferencesRequest,
  deleteAccountRequest,
} from '../api/auth.js';

const AuthContext = createContext(null);

// The JWT is kept in localStorage. This is a simple, common approach for
// a student project — worth mentioning in a viva that httpOnly cookies
// are a more XSS-resistant alternative in production-grade apps.
const TOKEN_KEY = 'studymate_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  // 'loading' stays true only while we're checking an existing token on
  // first load, so protected routes don't flash a redirect-to-login
  // before we've had a chance to confirm the user is actually logged in.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await meRequest(token);
        if (!cancelled) setUser(data.user);
      } catch {
        // Token is invalid or expired — clear it and treat as logged out.
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const signup = useCallback(async (formValues) => {
    const data = await signupRequest(formValues);
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const login = useCallback(async (formValues) => {
    const data = await loginRequest(formValues);
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async ({ name, email }) => {
    if (!token) throw new Error('You must be logged in to update your profile.');

    const data = await updateProfileRequest({ name, email }, token);
    setUser(data.user);
    return data.user;
  }, [token]);

  const updatePreferences = useCallback(async (preferences) => {
    if (!token) throw new Error('You must be logged in to update your preferences.');

    const data = await updatePreferencesRequest(preferences, token);
    setUser(data.user);
    return data.user;
  }, [token]);

  const deleteAccount = useCallback(async () => {
    if (!token) throw new Error('You must be logged in to delete your account.');

    await deleteAccountRequest(token);
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        updateProfile,
        updatePreferences,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an <AuthProvider>');
  return ctx;
}
