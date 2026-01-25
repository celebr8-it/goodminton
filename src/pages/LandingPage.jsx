import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Shuffle, BarChart3, ChevronRight, Zap, Target, Award } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();
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

    const features = [
        {
            icon: Users,
            title: 'Group Management',
            description: 'Create groups and invite your badminton buddies with a simple code.'
        },
        {
            icon: Shuffle,
            title: 'Random Teams',
            description: 'Generate balanced teams automatically with one click.'
        },
        {
            icon: Target,
            title: 'Match Tracking',
            description: 'Record scores and track every set in your matches.'
        },
        {
            icon: BarChart3,
            title: 'Analytics',
            description: 'View player stats and performance over time.'
        }
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#0F172A' }}>
            {/* Hero Section */}
            <div
                ref={heroRef}
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Animated Background Orbs */}
                <div
                    style={{
                        position: 'absolute',
                        top: '5%',
                        left: '5%',
                        width: '500px',
                        height: '500px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)',
                        filter: 'blur(80px)',
                        transform: `translate(${mousePosition.x * 40}px, ${mousePosition.y * 40}px)`,
                        transition: 'transform 0.4s ease-out',
                        pointerEvents: 'none'
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '5%',
                        right: '5%',
                        width: '600px',
                        height: '600px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
                        filter: 'blur(100px)',
                        transform: `translate(${mousePosition.x * -50}px, ${mousePosition.y * -50}px)`,
                        transition: 'transform 0.4s ease-out',
                        pointerEvents: 'none'
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        top: '40%',
                        right: '30%',
                        width: '350px',
                        height: '350px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
                        filter: 'blur(60px)',
                        transform: `translate(${mousePosition.x * 60}px, ${mousePosition.y * 60}px)`,
                        transition: 'transform 0.3s ease-out',
                        pointerEvents: 'none'
                    }}
                />

                {/* Grid Pattern */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `
                            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                        `,
                        backgroundSize: '80px 80px',
                        transform: `translate(${mousePosition.x * 15}px, ${mousePosition.y * 15}px)`,
                        transition: 'transform 0.5s ease-out',
                        pointerEvents: 'none'
                    }}
                />

                {/* Navigation */}
                <nav style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    padding: '20px 32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 20
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            padding: '10px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #6366F1, #4F46E5)'
                        }}>
                            <Trophy size={22} color="white" />
                        </div>
                        <span style={{ fontSize: '20px', fontWeight: 700, color: '#F8FAFC' }}>
                            Goodminton
                        </span>
                    </div>
                    <button
                        onClick={() => navigate('/auth')}
                        style={{
                            padding: '10px 20px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '10px',
                            color: '#F8FAFC',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Sign In
                    </button>
                </nav>

                {/* Hero Content */}
                <div style={{
                    position: 'relative',
                    zIndex: 10,
                    textAlign: 'center',
                    maxWidth: '800px',
                    transform: `translate(${mousePosition.x * -8}px, ${mousePosition.y * -8}px)`,
                    transition: 'transform 0.4s ease-out'
                }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: 'rgba(99, 102, 241, 0.2)',
                        borderRadius: '20px',
                        marginBottom: '24px',
                        border: '1px solid rgba(99, 102, 241, 0.3)'
                    }}>
                        <Zap size={14} color="#A5B4FC" />
                        <span style={{ fontSize: '13px', color: '#A5B4FC', fontWeight: 500 }}>
                            The ultimate badminton tournament manager
                        </span>
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(40px, 8vw, 72px)',
                        fontWeight: 800,
                        lineHeight: 1.1,
                        marginBottom: '24px',
                        background: 'linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-2px'
                    }}>
                        Organize. Play.
                        <br />
                        <span style={{
                            background: 'linear-gradient(135deg, #A5B4FC 0%, #6366F1 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            Dominate.
                        </span>
                    </h1>

                    <p style={{
                        fontSize: '18px',
                        color: '#94A3B8',
                        lineHeight: 1.7,
                        marginBottom: '40px',
                        maxWidth: '600px',
                        margin: '0 auto 40px'
                    }}>
                        Create groups, generate random teams, track match scores,
                        and crush your friends in badminton tournaments.
                    </p>

                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => navigate('/auth')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '18px 32px',
                                background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                                border: 'none',
                                borderRadius: '14px',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4)',
                                transition: 'all 0.2s'
                            }}
                        >
                            Get Started Free
                            <ChevronRight size={20} />
                        </button>
                        <button
                            onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '18px 32px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '14px',
                                color: '#E2E8F0',
                                fontSize: '16px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Learn More
                        </button>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div style={{
                    position: 'absolute',
                    bottom: '40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    animation: 'bounce 2s infinite'
                }}>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>Scroll</span>
                    <div style={{
                        width: '24px',
                        height: '40px',
                        border: '2px solid #334155',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'center',
                        paddingTop: '8px'
                    }}>
                        <div style={{
                            width: '4px',
                            height: '8px',
                            background: '#6366F1',
                            borderRadius: '2px',
                            animation: 'scrollDot 2s infinite'
                        }} />
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div id="features" style={{
                padding: '100px 24px',
                background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)'
            }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{
                            fontSize: '36px',
                            fontWeight: 700,
                            color: '#F8FAFC',
                            marginBottom: '16px'
                        }}>
                            Everything you need
                        </h2>
                        <p style={{ fontSize: '18px', color: '#94A3B8', maxWidth: '500px', margin: '0 auto' }}>
                            Simple, powerful tools to run your badminton tournaments like a pro.
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '24px'
                    }}>
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: '32px',
                                    background: 'rgba(30, 41, 59, 0.5)',
                                    borderRadius: '20px',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    transition: 'all 0.3s'
                                }}
                            >
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '14px',
                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '20px'
                                }}>
                                    <feature.icon size={26} color="#A5B4FC" />
                                </div>
                                <h3 style={{
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    color: '#F8FAFC',
                                    marginBottom: '12px'
                                }}>
                                    {feature.title}
                                </h3>
                                <p style={{
                                    fontSize: '15px',
                                    color: '#94A3B8',
                                    lineHeight: 1.6
                                }}>
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div style={{
                padding: '100px 24px',
                background: '#1E293B',
                textAlign: 'center'
            }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '24px'
                }}>
                    <Award size={40} color="#6366F1" />
                </div>
                <h2 style={{
                    fontSize: '32px',
                    fontWeight: 700,
                    color: '#F8FAFC',
                    marginBottom: '16px'
                }}>
                    Ready to start playing?
                </h2>
                <p style={{
                    fontSize: '18px',
                    color: '#94A3B8',
                    marginBottom: '32px'
                }}>
                    Join hundreds of badminton players already using Goodminton.
                </p>
                <button
                    onClick={() => navigate('/auth')}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '18px 40px',
                        background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                        border: 'none',
                        borderRadius: '14px',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4)'
                    }}
                >
                    Create Free Account
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Footer */}
            <footer style={{
                padding: '40px 24px',
                background: '#0F172A',
                textAlign: 'center',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <p style={{ fontSize: '14px', color: '#64748B' }}>
                    🏸 Made with ❤️ for badminton enthusiasts
                </p>
            </footer>

            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateX(-50%) translateY(0); }
                    50% { transform: translateX(-50%) translateY(10px); }
                }
                @keyframes scrollDot {
                    0%, 100% { opacity: 1; transform: translateY(0); }
                    50% { opacity: 0.5; transform: translateY(6px); }
                }
            `}</style>
        </div>
    );
};

export default LandingPage;
