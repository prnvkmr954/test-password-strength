'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const { user, isLoggedIn, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-brand">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        PassGuard
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <ul className="navbar-links">
          <li><Link href="/" className={pathname === '/' ? 'active' : ''}>Home</Link></li>
          {!isLoggedIn && (
            <>
              <li><Link href="/register" className={pathname === '/register' ? 'active' : ''}>Register</Link></li>
              <li><Link href="/login" className={pathname === '/login' ? 'active' : ''}>Login</Link></li>
            </>
          )}
          {isLoggedIn && (
            <li>
              <Link href="/change-password" className={pathname === '/change-password' ? 'active' : ''}>
                Change Password
              </Link>
            </li>
          )}
        </ul>

        {isLoggedIn && user && (
          <div className="navbar-user">
            <div className="navbar-user-badge">
              <span className="avatar">{user.username[0].toUpperCase()}</span>
              {user.username}
            </div>
            <button className="btn-logout" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
