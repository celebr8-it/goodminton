import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, Users, Home, Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from '../lib/ThemeContext';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import clsx from 'clsx';

const Layout = ({ children }) => {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const { user } = useAuth();

    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Users, label: 'Groups', path: '/groups' },
        { icon: Trophy, label: 'Tournaments', path: '/tournaments' },
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
            {/* Header */}
            <header style={{
                backgroundColor: 'var(--bg-surface)',
                borderBottom: '1px solid var(--border-color)',
                position: 'sticky',
                top: 0,
                zIndex: 40
            }}>
                <div style={{
                    maxWidth: '1024px',
                    margin: '0 auto',
                    padding: '12px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
                        <div style={{
                            padding: '10px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-dark))'
                        }}>
                            <Trophy className="text-white" size={22} />
                        </div>
                        <span style={{
                            fontSize: '20px',
                            fontWeight: 700,
                            color: 'var(--accent-primary)'
                        }}>
                            Goodminton
                        </span>
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                            onClick={toggleTheme}
                            style={{
                                padding: '10px',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>

                        <div className="avatar avatar-sm">
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>

                        <button
                            onClick={handleLogout}
                            style={{
                                padding: '10px',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main style={{
                maxWidth: '1024px',
                margin: '0 auto',
                padding: '24px 20px 120px 20px'
            }}>
                {children}
            </main>

            {/* Bottom Navigation - Mobile */}
            <nav className="md:hidden" style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                backgroundColor: 'var(--bg-surface)',
                borderTop: '1px solid var(--border-color)',
                padding: '8px 16px 12px 16px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path ||
                            (item.path === '/groups' && location.pathname.startsWith('/groups'));
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '8px 20px',
                                    borderRadius: '12px',
                                    textDecoration: 'none',
                                    color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                                    backgroundColor: isActive ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                <span style={{ fontSize: '11px', fontWeight: 600 }}>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
};

export default Layout;
