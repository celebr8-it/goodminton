import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div>
            <div className="header-row">
                <div>
                    <h1 className="page-title">Welcome back! 👋</h1>
                    <p className="page-subtitle">Ready for some badminton?</p>
                </div>
            </div>

            <div className="grid-2 section-gap">
                <div
                    className="card card-hover"
                    style={{ cursor: 'pointer', textAlign: 'center', padding: '32px' }}
                    onClick={() => navigate('/groups')}
                >
                    <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🏸</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Quick Match</span>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                        Start a casual game
                    </p>
                </div>
                <div
                    className="card card-hover"
                    style={{ cursor: 'pointer', textAlign: 'center', padding: '32px' }}
                    onClick={() => navigate('/tournaments')}
                >
                    <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🏆</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Tournament</span>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                        Compete with friends
                    </p>
                </div>
            </div>

            <div className="card">
                <h2 className="section-title" style={{ marginBottom: '16px' }}>Recent Activity</h2>
                <div className="empty-state">
                    <p>No recent matches. Start playing!</p>
                </div>
            </div>
        </div>
    );
};

export default Home;
