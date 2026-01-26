import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { TournamentService } from '../services/TournamentService';
import { Trophy, Loader2, Users } from 'lucide-react';

const Tournaments = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTournaments();
    }, [user]);

    const fetchTournaments = async () => {
        if (!user) return;

        try {
            const tournamentsData = await TournamentService.getUserTournaments(user.id);
            setTournaments(tournamentsData);
        } catch (err) {
            console.error('Error fetching tournaments:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                <Loader2 className="animate-spin" size={36} style={{ color: 'var(--accent-primary)' }} />
            </div>
        );
    }

    return (
        <div>
            <div className="header-row">
                <div>
                    <h1 className="page-title">My Tournaments</h1>
                    <p className="page-subtitle">View all tournaments you're part of</p>
                </div>
            </div>

            {tournaments.length === 0 ? (
                <div className="card empty-state">
                    <Trophy size={64} className="empty-state-icon" style={{ color: 'var(--accent-primary)' }} />
                    <p style={{ marginBottom: '4px', fontWeight: 600 }}>No tournaments yet</p>
                    <p style={{ fontSize: '14px' }}>Join a group to participate in tournaments!</p>
                </div>
            ) : (
                <div className="grid-2">
                    {tournaments.map((tournament) => (
                        <div
                            key={tournament.id}
                            className="card card-hover"
                            onClick={() => navigate(`/tournaments/${tournament.id}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                                <div style={{
                                    padding: '14px',
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                                    flexShrink: 0
                                }}>
                                    <Trophy size={24} style={{ color: 'var(--accent-primary)' }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{
                                        fontSize: '18px',
                                        fontWeight: 700,
                                        marginBottom: '6px',
                                        color: 'var(--text-primary)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {tournament.name}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <Users size={14} style={{ color: 'var(--text-muted)' }} />
                                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                            {tournament.groups?.name}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {tournament.scoring_type?.replace('_', ' ')}
                                </span>
                                <span className={tournament.status === 'active' ? 'badge badge-success' : tournament.status === 'completed' ? 'badge badge-draft' : 'badge badge-primary'}>
                                    {tournament.status === 'active' ? '🟢 Active' : tournament.status === 'completed' ? '✅ Completed' : '📝 Draft'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Tournaments;
