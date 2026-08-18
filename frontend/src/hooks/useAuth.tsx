"use client";

import toast from "react-hot-toast";

import { createContext, useContext, useEffect, useState } from "react";
import { User, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, SAMLAuthProvider, OAuthProvider, linkWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserData {
  role: string;
  plan: string;
  name: string;
  email: string;
  tenant_id?: string;
  workspaces?: string[];
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithSSO: (providerId: string, tenantId?: string) => Promise<void>;
  linkAccount: (providerId: string) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithSSO: async () => {},
  linkAccount: async () => {},
  logOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserData: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Listen to Firestore user doc in real-time
        const userRef = doc(db, "users", currentUser.uid);
        unsubscribeUserData = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data() as UserData);
          }
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
        if (unsubscribeUserData) unsubscribeUserData();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserData) unsubscribeUserData();
    };
  }, []);


  const handleUserFirestore = async (loggedInUser: User, tenantId?: string) => {
    const userRef = doc(db, "users", loggedInUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: loggedInUser.email,
        name: loggedInUser.displayName || "Unknown User",
        role: "member",
        plan: "free",
        tenant_id: tenantId || null,
        workspaces: tenantId ? [tenantId] : [],
        created_at: new Date().toISOString(),
        subscription_status: "none",
        subscription_id: null,
        customer_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        payment_date: null
      });
    } else {
      // Preserve roles but update tenant if needed
      const existingData = userSnap.data();
      const updates: Record<string, unknown> = {};
      let needsUpdate = false;
      
      if (tenantId && existingData.tenant_id !== tenantId) {
        updates.tenant_id = tenantId;
        updates.workspaces = existingData.workspaces ? Array.from(new Set([...existingData.workspaces, tenantId])) : [tenantId];
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await setDoc(userRef, updates, { merge: true });
      }
    }
  };

  const handleAuthError = async (error: unknown) => {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'auth/account-exists-with-different-credential') {
      const email = (error as { customData?: { email?: string } }).customData?.email;
      if (email) {
        toast.error(`An account already exists with ${email}. Please sign in using your original provider to link accounts.`);
      }
    }
    console.error("Authentication error:", error);
    throw error;
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await handleUserFirestore(result.user);
    } catch (error) {
      await handleAuthError(error);
    }
  };

  const signInWithSSO = async (providerId: string, tenantId?: string) => {
    try {
      if (tenantId) {
        auth.tenantId = tenantId;
      } else {
        auth.tenantId = null;
      }
      
      let provider;
      if (providerId.startsWith('saml.')) {
        provider = new SAMLAuthProvider(providerId);
      } else {
        provider = new OAuthProvider(providerId);
      }
      
      const result = await signInWithPopup(auth, provider);
      await handleUserFirestore(result.user, tenantId);
    } catch (error) {
      await handleAuthError(error);
    } finally {
      auth.tenantId = null; // Reset tenant ID
    }
  };

  const linkAccount = async (providerId: string) => {
    if (!auth.currentUser) throw new Error("Must be logged in to link account.");
    try {
      let provider;
      if (providerId === 'google.com') {
        provider = new GoogleAuthProvider();
      } else if (providerId.startsWith('saml.')) {
        provider = new SAMLAuthProvider(providerId);
      } else {
        provider = new OAuthProvider(providerId);
      }
      await linkWithPopup(auth.currentUser, provider);
    } catch (error) {
      console.error("Error linking account:", error);
      throw error;
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, signInWithGoogle, signInWithSSO, linkAccount, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};
