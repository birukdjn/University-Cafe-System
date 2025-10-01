"use client";

import { useState } from 'react';
import axios from 'axios';
import { setTokens } from '../../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://cafe-api-f9re.onrender.com";

export default function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/api/cafe/auth/login/`, { username, password });
      const tokens = res.data.tokens;
      setTokens(tokens);
      onLogin && onLogin();
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div>
        <label className="block text-sm">Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded" />
      </div>
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
