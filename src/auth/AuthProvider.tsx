import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { Coach, CoachRole } from '../domain/types';

interface AuthState {
  user: User | null;
  coach: Coach | null;
  role: CoachRole | null;
  /** true while the initial auth state is still resolving */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [role, setRole] = useState<CoachRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // role from the custom claim (set by the seed); fall back to the coach doc.
        const token = await u.getIdTokenResult();
        const claimRole = token.claims.role as CoachRole | undefined;
        try {
          const snap = await getDoc(doc(db, 'coaches', u.uid));
          const data = snap.exists() ? (snap.data() as Omit<Coach, 'id'>) : null;
          setCoach(data ? { id: u.uid, ...data } : null);
          setRole(claimRole ?? data?.role ?? null);
        } catch {
          setCoach(null);
          setRole(claimRole ?? null);
        }
      } else {
        setCoach(null);
        setRole(null);
      }
      setLoading(false);
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const signOut = async () => {
    await fbSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, coach, role, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

/** Convenience: is the signed-in coach the main/head coach? */
// eslint-disable-next-line react-refresh/only-export-components
export function useIsMainCoach(): boolean {
  return useAuth().role === 'main';
}
