'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthWidget({ onAuthChange }: { onAuthChange?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else onAuthChange && onAuthChange();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onAuthChange && onAuthChange();
  };

  return (
    <div>
      {!user && (
        <form onSubmit={handleLogin} style={{ marginBottom: 8 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ border: '1px solid #e5e7eb', borderRadius: 4, padding: '8px', marginBottom: 8, width: '100%', boxSizing: 'border-box' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ border: '1px solid #e5e7eb', borderRadius: 4, padding: '8px', marginBottom: 8, width: '100%', boxSizing: 'border-box' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ border: '2px solid #2563eb', borderRadius: 4, background: '#2563eb', color: 'white', padding: '8px 16px', width: '100%', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            Login
          </button>
        </form>
      )}
      {user && (
        <button 
          onClick={handleLogout}
          style={{ border: '2px solid #dc2626', borderRadius: 4, background: 'white', color: '#dc2626', padding: '8px 16px', width: '100%', fontWeight: 600, cursor: 'pointer' }}
        >
          Logout
        </button>
      )}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
} 