'use client';

import { useState, useEffect } from 'react';
import { authHelpers } from '@/lib/firebase';
import type { User } from 'firebase/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = authHelpers.onAuthStateChanged((user) => {
      setUser(user);
      setIsAdmin(authHelpers.isAdmin(user));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const user = await authHelpers.signInWithGoogle();
    return user;
  };

  const signOut = async () => {
    await authHelpers.signOut();
  };

  return {
    user,
    loading,
    isAdmin,
    signIn,
    signOut,
  };
}
