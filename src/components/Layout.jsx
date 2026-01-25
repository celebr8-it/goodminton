import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, Users, Home, PlusCircle } from 'lucide-react';
import clsx from 'clsx';

const Layout = ({ children }) => {
    const location = useLocation();

    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Users, label: 'Groups', path: '/groups' },
        { icon: Trophy, label: 'My Tournaments', path: '/tournaments' },
    ];

    return (
        <div className="min-h-screen bg-background text-text font-sans">
            <main className="pb-20 pt-4 px-4 max-w-md mx-auto min-h-screen">
                {children}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/10 px-6 py-3 z-50">
                <div className="max-w-md mx-auto flex justify-between items-center">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "flex flex-col items-center gap-1 transition-colors duration-200",
                                    isActive ? "text-primary" : "text-muted hover:text-text"
                                )}
                            >
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
};

export default Layout;
