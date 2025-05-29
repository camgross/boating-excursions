'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthStatus() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <div>
      {user ? `Logged in as: ${user.email}` : 'Not logged in'}
    </div>
  );
} 