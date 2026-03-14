import React, { useState, useEffect } from 'react';
import { UserPlus, Map, Loader2 } from 'lucide-react';
import { UserService } from '../services/UserService';

const UserMap = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchPlayers();
    }, []);

    const fetchPlayers = async () => {
        try {
            setLoading(true);
            const data = await UserService.getAllPlayers();
            setPlayers(data);
        } catch (err) {
            console.error('Error fetching players:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPlayer = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        
        if (!name.trim() || !email.trim()) {
            setError('Name and email are required');
            return;
        }

        setAdding(true);

        try {
            await UserService.addPlayer(name, email);
            setSuccess(`Successfully added player ${name}`);
            setName('');
            setEmail('');
            // Refresh list
            fetchPlayers();
        } catch (err) {
            console.error('Error adding player:', err);
            setError(err.message || 'Failed to add player');
        } finally {
            setAdding(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Map size={24} style={{ color: 'var(--accent-primary)' }} />
                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Global User Map</h1>
            </div>

            <div className="card section-gap">
                <h2 className="section-title" style={{ marginBottom: '16px' }}>
                    <UserPlus size={20} />
                    Add New User
                </h2>
                <form onSubmit={handleAddPlayer}>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label className="input-label">Full Name</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label className="input-label">Email Address</label>
                            <input
                                type="email"
                                className="input-field"
                                placeholder="john@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{ color: '#EF4444', fontSize: '14px', marginBottom: '16px' }}>
                            {error}
                        </div>
                    )}
                    
                    {success && (
                        <div style={{ color: '#10B981', fontSize: '14px', marginBottom: '16px' }}>
                            {success}
                        </div>
                    )}

                    <button type="submit" className="btn-primary" disabled={adding}>
                        {adding ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                        Add User
                    </button>
                </form>
            </div>

            <div className="card section-gap">
                <h2 className="section-title" style={{ marginBottom: '16px' }}>
                    All Users in System ({players.length})
                </h2>
                
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent-primary)' }} />
                    </div>
                ) : (
                    <div className="grid-2">
                        {players.map(player => (
                            <div key={player.id} className="item-row">
                                <div className="avatar avatar-md">
                                    {player.full_name?.charAt(0).toUpperCase() || player.email?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{player.full_name || 'Anonymous'}</p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{player.email}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserMap;
