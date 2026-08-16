"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserData {
  role: string;
  plan: string;
  name: string;
  email: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  signInWithGoogle: async () => {},
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

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const loggedInUser = result.user;

      // Check if user exists in Firestore
      const userRef = doc(db, "users", loggedInUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Create user with hardcoded role and plan
        await setDoc(userRef, {
          email: loggedInUser.email,
          name: loggedInUser.displayName,
          role: "member",
          plan: "free",
          created_at: new Date().toISOString(),
          subscription_status: "none",
          subscription_id: null,
          customer_id: null,
          current_period_start: null,
          current_period_end: null,
          cancel_at_period_end: false,
          payment_date: null
        });
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
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
    <AuthContext.Provider value={{ user, userData, loading, signInWithGoogle, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};
