import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User, UserProfile } from '@/types';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChange, signInWithEmail, signInWithGoogle, registerWithEmail, firebaseSignOut } from '@/services/firebase';
import { syncUser } from '@/services/api';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, fullName: string, institution: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChange(async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          const result = await syncUser(fbUser.uid, fbUser.email || '', 'RESEARCHER', fbUser.displayName || '', '');
          setUser(result.user);
          setProfile(result.profile);
        } catch {
          setUser({
            user_id: fbUser.uid,
            email: fbUser.email || '',
            role: 'RESEARCHER',
            is_active: true,
            created_at: new Date().toISOString(),
          });
          setProfile(null);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmail(email, password);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await signInWithGoogle();
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string, institution: string, role: string) => {
    const cred = await registerWithEmail(email, password);
    try {
      const result = await syncUser(cred.user.uid, email, role, fullName, institution);
      setUser(result.user);
      setProfile(result.profile);
    } catch {
      setUser({
        user_id: cred.user.uid,
        email,
        role: role as 'ADMIN' | 'RESEARCHER',
        is_active: true,
        created_at: new Date().toISOString(),
      });
    }
  }, []);

  const logout = useCallback(async () => {
    await firebaseSignOut();
    setUser(null);
    setProfile(null);
    setFirebaseUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, firebaseUser, loading, login, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
