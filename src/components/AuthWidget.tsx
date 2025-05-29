'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthWidget({ onAuthChange }: { onAuthChange?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      <form onSubmit={handleLogin} style={{ marginBottom: 8 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>Login</button>
      </form>
      <button onClick={handleLogout}>Logout</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
} 