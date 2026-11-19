import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { firebaseAuth, googleProvider } from "../firebase.js";
import {
  ensureFirebaseUserDocuments,
  saveFarmToFirestore,
  saveUserPhoneToFirestore,
} from "../services/firestoreService.js";
import { User, Farm } from "../types/index.js";

interface AuthContextType {
  user: User | null;
  farm: Farm | null;
  token: string | null;
  isAuthenticated: boolean;
  isFirebaseAuth: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  demoLogin: (role: 'farmer' | 'admin') => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string; role?: string; farm?: Partial<Farm> }) => Promise<void>;
  updateFarm: (farmData: Partial<Farm>) => Promise<void>;
  updatePhone: (phone: string) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("agri_auth_token"));
  const [isFirebaseAuth, setIsFirebaseAuth] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const firebaseInitializedRef = useRef<boolean>(false);

  async function syncFirebaseSessionWithBackend(idToken: string, phone?: string) {
    try {
      const res = await fetch("/api/auth/firebase-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, phone }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        localStorage.setItem("agri_auth_token", data.token);
      }
    } catch (err) {
      console.warn("Could not exchange Firebase session token:", err);
    }
  }

  // Initialize and listen to Firebase Auth + fallback Express JWT session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      firebaseInitializedRef.current = true;
      if (fbUser) {
        try {
          const prefLang = localStorage.getItem("agri_pref_lang") || "en";
          const [{ user: fsUser, farm: fsFarm }, idToken] = await Promise.all([
            ensureFirebaseUserDocuments(fbUser, prefLang),
            fbUser.getIdToken(),
          ]);
          setUser(fsUser);
          setFarm(fsFarm);
          setIsFirebaseAuth(true);
          await syncFirebaseSessionWithBackend(idToken, fsUser.phone);
        } catch (err) {
          console.error("Failed to initialize Firebase user documents:", err);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // Not signed in with Firebase — check existing Express JWT session
      setIsFirebaseAuth(false);
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
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    const fbUser = result.user;
    const prefLang = localStorage.getItem("agri_pref_lang") || "en";
    const [{ user: fsUser, farm: fsFarm }, idToken] = await Promise.all([
      ensureFirebaseUserDocuments(fbUser, prefLang),
      fbUser.getIdToken(),
    ]);
    setUser(fsUser);
    setFarm(fsFarm);
    setIsFirebaseAuth(true);
    await syncFirebaseSessionWithBackend(idToken, fsUser.phone);
  };

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Login failed");
    }
    setIsFirebaseAuth(false);
    setUser(data.user);
    setFarm(data.farm);
    setToken(data.token);
    localStorage.setItem("agri_auth_token", data.token);
  };

  const demoLogin = async (role: 'farmer' | 'admin') => {
    if (firebaseAuth.currentUser) {
      await signOut(firebaseAuth).catch(() => {});
    }
    const res = await fetch("/api/auth/demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Demo login failed");
    }
    setIsFirebaseAuth(false);
    setUser(data.user);
    setFarm(data.farm);
    setToken(data.token);
    localStorage.setItem("agri_auth_token", data.token);
  };

  const register = async (regData: { name: string; email: string; password: string; phone?: string; role?: string; farm?: Partial<Farm> }) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...regData,
        email: regData.email.trim(),
        name: regData.name.trim()
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Registration failed");
    }
    setIsFirebaseAuth(false);
    setUser(data.user);
    setFarm(data.farm);
    setToken(data.token);
    localStorage.setItem("agri_auth_token", data.token);
  };

  const updateFarm = async (farmData: Partial<Farm>) => {
    if (isFirebaseAuth && firebaseAuth.currentUser) {
      const updatedFsFarm = await saveFarmToFirestore(firebaseAuth.currentUser.uid, farmData);
      setFarm(updatedFsFarm);
      if (token) {
        await fetch("/api/farms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(farmData)
        }).catch(() => {});
      }
      return;
    }

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

  const updatePhone = async (phone: string) => {
    const cleaned = phone.trim();
    if (isFirebaseAuth && firebaseAuth.currentUser) {
      await saveUserPhoneToFirestore(firebaseAuth.currentUser.uid, cleaned);
    }
    if (token) {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ phone: cleaned })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update mobile number");
      }
    }
    setUser((prev) => (prev ? { ...prev, phone: cleaned } : prev));
  };

  const refreshUserData = async () => {
    if (isFirebaseAuth && firebaseAuth.currentUser) {
      const prefLang = localStorage.getItem("agri_pref_lang") || "en";
      const { user: fsUser, farm: fsFarm } = await ensureFirebaseUserDocuments(
        firebaseAuth.currentUser,
        prefLang
      );
      setUser(fsUser);
      setFarm(fsFarm);
      return;
    }

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
    if (firebaseAuth.currentUser) {
      signOut(firebaseAuth).catch(() => {});
    }
    setIsFirebaseAuth(false);
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
        isFirebaseAuth,
        isLoading,
        login,
        loginWithGoogle,
        demoLogin,
        register,
        updateFarm,
        updatePhone,
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
