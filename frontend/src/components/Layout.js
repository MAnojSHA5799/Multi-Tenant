import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Users, 
  Settings, 
  Activity, 
  Database, 
  UserPlus,
  LogOut,
  Menu,
  X
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Source Config', href: '/source-config', icon: Database },
    { name: 'Pipelines', href: '/pipelines', icon: Activity },
    { name: 'System Health', href: '/system-health', icon: Settings },
    ...(isAdmin() ? [{ name: 'User Management', href: '/users', icon: UserPlus }] : [])
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div>
      {/* Header */}
      <header className="navbar">
        <div className="container navbar-content">
          <div className="navbar-brand">Admin Portal</div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#6b7280' }}>
              Welcome, {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <LogOut size={16} />
              Logout
            </button>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn"
              style={{ display: 'none', padding: '0.5rem' }}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {children}
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout; 