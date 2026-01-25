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
            <header className="sticky top-0 z-40" style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-dark))' }}>
                            <Trophy className="text-white" size={24} />
                        </div>
                        <h1 className="text-xl font-bold" style={{ color: 'var(--accent-primary)' }}>Goodminton</h1>
                    </Link>

                    <div className="flex items-center gap-2">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>

                        {/* User Avatar */}
                        <div className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                            style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-dark))' }}>
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg transition-colors hover:opacity-70"
                            style={{ color: 'var(--text-muted)' }}
                            title="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
                {children}
            </main>

            {/* Bottom Navigation - Mobile */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50" style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border-color)' }}>
                <div className="flex justify-around items-center px-4 py-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path ||
                            (item.path === '/groups' && location.pathname.startsWith('/groups'));
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all",
                                    isActive && "bg-opacity-10"
                                )}
                                style={{
                                    color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                                    backgroundColor: isActive ? 'rgba(65, 105, 225, 0.1)' : 'transparent'
                                }}
                            >
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-xs font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
};

export default Layout;
