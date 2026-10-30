
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { AuthContext } from "./AuthContextValue";
import { apiRequest } from "../lib/api";
import {
  clearAccessToken,
  setAccessToken,
} from "../features/auth/authSession";

let recoveryPromise = null;

function getUserFromResponse(result) {
  return result?.data?.user ?? null;
}

async function recoverSession() {
  if (!recoveryPromise) {
    recoveryPromise = (async () => {
      const refreshResult = await apiRequest("/auth/refresh", {
        method: "POST",
      });

      const token = refreshResult?.data?.accessToken;

      if (!token) {
        throw new Error("Session could not be restored.");
      }

      setAccessToken(token);

      const meResult = await apiRequest("/auth/me");
      const user = getUserFromResponse(meResult);

      if (!user || typeof user !== "object") {
        throw new Error("Unable to load the current user.");
      }

      return user;
    })().finally(() => {
      recoveryPromise = null;
    });
  }

  return recoveryPromise;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const result = await apiRequest("/auth/me");
    const currentUser = getUserFromResponse(result);

    if (!currentUser || typeof currentUser !== "object") {
      throw new Error("Unable to load the current user.");
    }

    setUser(currentUser);
    return currentUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
      });
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function initializeAuth() {
      try {
        const currentUser = await recoverSession();

        if (active) {
          setUser(currentUser);
        }
      } catch {
        clearAccessToken();

        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      active = false;
    };
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    refreshUser,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
