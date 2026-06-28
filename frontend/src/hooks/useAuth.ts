// frontend/src/hooks/useAuth.ts
import { useState, useCallback } from "react";
import type { UserRole } from "../theme";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teamId?: string;
  avatar?: string | null;
}

const parseUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
};

export const useAuth = () => {
  const [user,  setUser]  = useState<AuthUser | null>(parseUser);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));

  const login = useCallback((newUser: AuthUser, newToken: string) => {
    localStorage.setItem("user",  JSON.stringify(newUser));
    localStorage.setItem("token", newToken);
    setUser(newUser);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  }, []);

  const updateUser = useCallback((partial: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { user, token, login, logout, updateUser, isAuthenticated: !!token && !!user };
};

// Lightweight singleton read — for components that don't need reactivity
export const getCurrentUser = (): AuthUser | null => parseUser();
export const getToken = (): string | null => localStorage.getItem("token");
