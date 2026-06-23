'use client';

import { useState } from 'react';
import Link from 'next/link';
import { changePassword } from '@/lib/api';
import { showToast } from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';

export default function ChangePasswordPage() {
  const { user, isLoggedIn } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shakeForm, setShakeForm] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isLoggedIn || !user) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Change Password</h1>
          <p>You need to be logged in to change your password</p>
        </div>
        <div className="card-static" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Please log in first to access this feature.
          </p>
          <Link href="/login" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary">Go to Login</button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="page-container">
        <div className="success-view">
          <div className="success-icon">✓</div>
          <h2>Password Updated!</h2>
          <p>Your password has been changed successfully.</p>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary" style={{ maxWidth: '300px', margin: '0 auto' }}>
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await changePassword(user.username, currentPassword, newPassword);
      showToast('Password updated successfully!', 'success');
      setSuccess(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Password change failed', 'error');
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Change Password</h1>
        <p>Update your password — the last 5 cannot be reused</p>
      </div>

      <div className={`card-static ${shakeForm ? 'shake' : ''}`}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="cp-username">Username</label>
            <div className="input-wrapper">
              <input
                id="cp-username"
                type="text"
                value={user.username}
                readOnly
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="cp-current">Current Password</label>
            <div className="input-wrapper">
              <input
                id="cp-current"
                type={showCurrentPw ? 'text' : 'password'}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                aria-label={showCurrentPw ? 'Hide password' : 'Show password'}
              >
                {showCurrentPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="cp-new">New Password</label>
            <div className="input-wrapper">
              <input
                id="cp-new"
                type={showNewPw ? 'text' : 'password'}
                placeholder="Create a new strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowNewPw(!showNewPw)}
                aria-label={showNewPw ? 'Hide password' : 'Show password'}
              >
                {showNewPw ? '🙈' : '👁️'}
              </button>
            </div>
            <PasswordStrengthMeter password={newPassword} />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !currentPassword || !newPassword}
          >
            {loading ? <span className="spinner" /> : null}
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="form-footer">
        <Link href="/">← Back to Dashboard</Link>
      </div>
    </div>
  );
}
