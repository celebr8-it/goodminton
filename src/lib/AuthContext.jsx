import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
            // Run profile creation in background
            if (session?.user) {
                ensureProfile(session.user);
            }
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
            // Run profile creation in background
            if (session?.user) {
                ensureProfile(session.user);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const ensureProfile = async (user) => {
        try {
            // Use upsert to ensure profile exists
            const { error } = await supabase.from('players').upsert(
                {
                    id: user.id,
                    email: user.email,
                    full_name: user.email?.split('@')[0] || 'Player'
                },
                { onConflict: 'id', ignoreDuplicates: false }
            );
            if (error) {
                console.error('Error ensuring profile:', error);
            }
        } catch (error) {
            console.error('Error in ensureProfile:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
