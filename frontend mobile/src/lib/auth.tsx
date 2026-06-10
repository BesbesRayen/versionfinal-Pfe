/* eslint-disable react-refresh/only-export-components */
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { AppState, Vibration } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthResponse, setAuthErrorHandler, setAuthToken } from "@/lib/api";
import { disconnectRealtimeSocket, resumeRealtimeSocket, subscribeToUserSync } from "@/lib/socket";

type AuthUser = Pick<AuthResponse, "userId" | "email" | "firstName" | "lastName">;

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoadingAuth: boolean;
  setUser: (user: AuthUser, token: string) => void;
  logout: () => void;
  creditSyncVersion: number;
  triggerCreditSync: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [creditSyncVersion, setCreditSyncVersion] = useState(0);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const doLogout = () => {
    disconnectRealtimeSocket();
    setUserState(null);
    setToken(null);
    setAuthToken(null);
    AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]).catch(() => {});
  };

  // Restore session from AsyncStorage on app start
  useEffect(() => {
    (async () => {
      try {
        const [savedToken, savedUserJson] = await Promise.all([
          AsyncStorage.getItem(AUTH_TOKEN_KEY),
          AsyncStorage.getItem(AUTH_USER_KEY),
        ]);
        if (savedToken && savedUserJson) {
          const savedUser: AuthUser = JSON.parse(savedUserJson);
          setToken(savedToken);
          setUserState(savedUser);
          setAuthToken(savedToken);
        }
      } catch {
        // Storage read failed — stay logged out
      } finally {
        setIsLoadingAuth(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!user || !token) return;

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        setCreditSyncVersion((value) => value + 1);
        refreshTimer = null;
      }, 75);
    };

    const unsubscribe = subscribeToUserSync(user.userId, token, (reason) => {
      if (reason === "notification") {
        Vibration.vibrate(120);
      }
      scheduleRefresh();
    });
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        resumeRealtimeSocket();
        scheduleRefresh();
      }
    });

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      unsubscribe();
      appStateSubscription.remove();
    };
  }, [user, token]);

  useEffect(() => {
    setAuthErrorHandler(() => {
      doLogout();
    });
    return () => setAuthErrorHandler(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoadingAuth,
      setUser: (nextUser, nextToken) => {
        setUserState(nextUser);
        setToken(nextToken);
        setAuthToken(nextToken);
        // Persist to storage (fire-and-forget)
        AsyncStorage.setItem(AUTH_TOKEN_KEY, nextToken).catch(() => {});
        AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser)).catch(() => {});
      },
      logout: () => {
        doLogout();
      },
      creditSyncVersion,
      triggerCreditSync: () => setCreditSyncVersion((value) => value + 1),
    }),
    [user, token, isLoadingAuth, creditSyncVersion],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
