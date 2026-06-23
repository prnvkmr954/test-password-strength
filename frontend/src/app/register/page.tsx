'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '@/lib/api';
import { showToast } from '@/components/Toast';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(username, password);
      showToast('Account created successfully! Please login.', 'success');
      router.push('/login');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Registration failed', 'error');
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Create Account</h1>
        <p>Register with a strong, secure password</p>
      </div>

      <div className={`card-static ${shakeForm ? 'shake' : ''}`}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reg-username">Username</label>
            <div className="input-wrapper">
              <input
                id="reg-username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <div className="input-wrapper">
              <input
                id="reg-password"
                type={showPw ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
            <PasswordStrengthMeter password={password} />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !username || !password}
          >
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>

      <div className="form-footer">
        Already have an account? <Link href="/login">Login here</Link>
      </div>
    </div>
  );
}
