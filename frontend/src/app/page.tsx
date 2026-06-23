'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { checkHealth, getUserProfile, type UserProfile } from '@/lib/api';

export default function HomePage() {
  const { user, isLoggedIn } = useAuth();
  const [health, setHealth] = useState<'checking' | 'online' | 'offline'>('checking');
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    checkHealth()
      .then(() => setHealth('online'))
      .catch(() => setHealth('offline'));
  }, []);

  useEffect(() => {
    if (isLoggedIn && user) {
      getUserProfile(user.username)
        .then(setProfile)
        .catch(() => {});
    } else {
      setProfile(null);
    }
  }, [isLoggedIn, user]);

  return (
    <div className="page-container wide">
      <div className="hero">
        <div className="hero-icon">🛡️</div>
        <h1>
          <span className="gradient-text">PassGuard</span>
        </h1>
        <p>
          Enforce strong password policies and track password history.
          Real-time strength analysis with enterprise-grade security.
        </p>
        <div className="hero-health">
          <span
            className={`health-dot ${
              health === 'online' ? 'online' : health === 'offline' ? 'offline' : ''
            }`}
          />
          {health === 'checking'
            ? 'Checking API...'
            : health === 'online'
            ? 'API Online'
            : 'API Offline'}
        </div>
      </div>

      {isLoggedIn && profile ? (
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <div className="card-static profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                {profile.username[0].toUpperCase()}
              </div>
              <div className="profile-info">
                <h3>Welcome back, {profile.username}!</h3>
                <p>Manage your password security below</p>
              </div>
            </div>
            <div className="profile-stats">
              <div className="profile-stat">
                <div className="profile-stat-label">Member Since</div>
                <div className="profile-stat-value">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat-label">Password Changes</div>
                <div className="profile-stat-value">
                  {profile.password_history_count}
                </div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat-label">Last Updated</div>
                <div className="profile-stat-value">
                  {new Date(profile.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat-label">Security Status</div>
                <div className="profile-stat-value" style={{ color: 'var(--green)' }}>
                  ● Protected
                </div>
              </div>
            </div>
          </div>
          <Link href="/change-password" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary" style={{ width: '100%' }}>
              🔑 Change Password
            </button>
          </Link>
        </div>
      ) : (
        <div className="feature-grid">
          <Link href="/register" className="feature-card">
            <div className="card">
              <div className="card-icon purple">📝</div>
              <h3>Register</h3>
              <p>
                Create a new account with a strong password. Real-time
                strength validation ensures security from day one.
              </p>
              <div className="card-arrow">→</div>
            </div>
          </Link>

          <Link href="/login" className="feature-card">
            <div className="card">
              <div className="card-icon cyan">🔐</div>
              <h3>Login</h3>
              <p>
                Authenticate with your credentials. Secure bcrypt-based
                password verification under the hood.
              </p>
              <div className="card-arrow">→</div>
            </div>
          </Link>

          <Link href="/login" className="feature-card">
            <div className="card">
              <div className="card-icon green">🔄</div>
              <h3>Change Password</h3>
              <p>
                Update your password with history enforcement. The last 5
                passwords cannot be reused.
              </p>
              <div className="card-arrow">→</div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
