import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Loader2, Trophy, ChevronRight } from 'lucide-react';

export default function AuthPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const heroRef = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (heroRef.current) {
                const rect = heroRef.current.getBoundingClientRect();
                const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
                const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
                setMousePosition({ x, y });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error: signUpError } = await supabase.auth.signUp({ email, password });
                if (signUpError) throw signUpError;
                alert('Check your email for the confirmation link!');
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
                if (signInError) throw signInError;
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            ref={heroRef}
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)'
            }}
        >
            {/* Animated Background Orbs */}
            <div
                style={{
                    position: 'absolute',
                    top: '10%',
                    left: '10%',
                    width: '400px',
                    height: '400px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                    transform: `translate(${mousePosition.x * 30}px, ${mousePosition.y * 30}px)`,
                    transition: 'transform 0.3s ease-out',
                    pointerEvents: 'none'
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    bottom: '10%',
                    right: '10%',
                    width: '500px',
                    height: '500px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                    transform: `translate(${mousePosition.x * -40}px, ${mousePosition.y * -40}px)`,
                    transition: 'transform 0.3s ease-out',
                    pointerEvents: 'none'
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
                    filter: 'blur(50px)',
                    transform: `translate(calc(-50% + ${mousePosition.x * 50}px), calc(-50% + ${mousePosition.y * 50}px))`,
                    transition: 'transform 0.2s ease-out',
                    pointerEvents: 'none'
                }}
            />

            {/* Grid Pattern Overlay */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px',
                    transform: `translate(${mousePosition.x * 10}px, ${mousePosition.y * 10}px)`,
                    transition: 'transform 0.4s ease-out',
                    pointerEvents: 'none'
                }}
            />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '420px' }}>
                {/* Hero Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginBottom: '24px',
                        transform: `translate(${mousePosition.x * -5}px, ${mousePosition.y * -5}px)`,
                        transition: 'transform 0.3s ease-out'
                    }}>
                        <div style={{
                            padding: '16px',
                            borderRadius: '20px',
                            background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                            boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4)'
                        }}>
                            <Trophy size={36} color="white" />
                        </div>
                    </div>
                    <h1 style={{
                        fontSize: '48px',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #F8FAFC 0%, #94A3B8 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '16px',
                        letterSpacing: '-1px'
                    }}>
                        Goodminton
                    </h1>
                    <p style={{
                        fontSize: '18px',
                        color: '#94A3B8',
                        lineHeight: 1.6
                    }}>
                        {isSignUp ? 'Join the game. Create your account.' : 'Welcome back, champion!'}
                    </p>
                </div>

                {/* Auth Card */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    padding: '32px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)'
                }}>
                    <form onSubmit={handleAuth}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: 600,
                                marginBottom: '8px',
                                color: '#E2E8F0'
                            }}>
                                Email
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={20} style={{
                                    position: 'absolute',
                                    left: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#64748B'
                                }} />
                                <input
                                    type="email"
                                    required
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '16px 16px 16px 52px',
                                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                        border: '1.5px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '14px',
                                        color: '#F8FAFC',
                                        fontSize: '15px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s, box-shadow 0.2s',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#6366F1';
                                        e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.15)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '14px',
                                fontWeight: 600,
                                marginBottom: '8px',
                                color: '#E2E8F0'
                            }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={20} style={{
                                    position: 'absolute',
                                    left: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#64748B'
                                }} />
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '16px 16px 16px 52px',
                                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                        border: '1.5px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '14px',
                                        color: '#F8FAFC',
                                        fontSize: '15px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s, box-shadow 0.2s',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#6366F1';
                                        e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.15)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        </div>

                        {error && (
                            <div style={{
                                padding: '14px 16px',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '12px',
                                color: '#FCA5A5',
                                fontSize: '14px',
                                marginBottom: '20px'
                            }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                padding: '16px 24px',
                                background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                                border: 'none',
                                borderRadius: '14px',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                                boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4)',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 15px 40px rgba(99, 102, 241, 0.5)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 10px 30px rgba(99, 102, 241, 0.4)';
                            }}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    {isSignUp ? 'Create Account' : 'Sign In'}
                                    <ChevronRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '24px' }}>
                        <button
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError(null);
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#A5B4FC',
                                fontSize: '14px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.color = '#C7D2FE'}
                            onMouseLeave={(e) => e.target.style.color = '#A5B4FC'}
                        >
                            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p style={{
                    textAlign: 'center',
                    marginTop: '32px',
                    fontSize: '13px',
                    color: '#64748B'
                }}>
                    🏸 Made for badminton enthusiasts
                </p>
            </div>
        </div>
    );
}
