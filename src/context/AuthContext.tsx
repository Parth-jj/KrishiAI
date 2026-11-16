import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Farm } from "../types/index.js";

interface AuthContextType {
  user: User | null;
  farm: Farm | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  demoLogin: (role: 'farmer' | 'admin') => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string; role?: string; farm?: Partial<Farm> }) => Promise<void>;
  updateFarm: (farmData: Partial<Farm>) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("agri_auth_token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and load user data on boot
  useEffect(() => {
    async function checkAuth() {
      const storedToken = localStorage.getItem("agri_auth_token");
      if (storedToken) {
        try {
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            setFarm(data.farm);
            setToken(storedToken);
          } else {
            // Invalid or expired token, clear storage
            localStorage.removeItem("agri_auth_token");
            setUser(null);
            setFarm(null);
            setToken(null);
          }
        } catch {
          localStorage.removeItem("agri_auth_token");
          setUser(null);
          setFarm(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setFarm(null);
        setToken(null);
      }
      setIsLoading(false);
    }

    checkAuth();
  }, []);

  const autoDemoLogin = async () => {
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "farmer" })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setFarm(data.farm);
        setToken(data.token);
        localStorage.setItem("agri_auth_token", data.token);
      }
    } catch (e) {
      console.warn("Auto demo login failed:", e);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }
      setUser(data.user);
      setFarm(data.farm);
      setToken(data.token);
      localStorage.setItem("agri_auth_token", data.token);
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: 'farmer' | 'admin') => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Demo login failed");
      }
      setUser(data.user);
      setFarm(data.farm);
      setToken(data.token);
      localStorage.setItem("agri_auth_token", data.token);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (regData: { name: string; email: string; password: string; phone?: string; role?: string; farm?: Partial<Farm> }) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }
      setUser(data.user);
      setFarm(data.farm);
      setToken(data.token);
      localStorage.setItem("agri_auth_token", data.token);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFarm = async (farmData: Partial<Farm>) => {
    if (!token) return;
    const res = await fetch("/api/farms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(farmData)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to update farm");
    }
    setFarm(data.farm);
  };

  const refreshUserData = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setFarm(data.farm);
      }
    } catch (e) {
      console.warn("Failed to refresh user data:", e);
    }
  };

  const logout = () => {
    setUser(null);
    setFarm(null);
    setToken(null);
    localStorage.removeItem("agri_auth_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        farm,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        demoLogin,
        register,
        updateFarm,
        logout,
        refreshUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
