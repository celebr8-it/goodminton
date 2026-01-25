import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Plus, Users, Loader2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const Groups = () => {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchGroups();
    }, [user]);

    const fetchGroups = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('group_members')
                .select(`
                    role,
                    groups (
                        id,
                        name,
                        image_url,
                        owner_id
                    )
                `)
                .eq('player_id', user.id);

            if (error) throw error;
            setGroups(data || []);
        } catch (err) {
            console.error('Error fetching groups:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;
        setCreating(true);

        try {
            const { data: groupData, error: groupError } = await supabase
                .from('groups')
                .insert([{ name: newGroupName, owner_id: user.id }])
                .select()
                .single();

            if (groupError) throw groupError;

            const { error: memberError } = await supabase
                .from('group_members')
                .insert([{ group_id: groupData.id, player_id: user.id, role: 'admin' }]);

            if (memberError) throw memberError;

            setNewGroupName('');
            setShowCreateModal(false);
            fetchGroups();
        } catch (err) {
            console.error('Error creating group:', err);
            alert('Failed to create group');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="header-row">
                <div>
                    <h1 className="page-title">My Groups</h1>
                    <p className="page-subtitle">Manage your badminton circles</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary"
                >
                    <Plus size={18} />
                    New Group
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                    <Loader2 className="animate-spin" size={36} style={{ color: 'var(--accent-primary)' }} />
                </div>
            ) : groups.length === 0 ? (
                <div className="card empty-state">
                    <Users size={56} className="empty-state-icon" style={{ color: 'var(--accent-primary)' }} />
                    <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                        No groups yet
                    </h3>
                    <p style={{ marginBottom: '24px', maxWidth: '300px', marginLeft: 'auto', marginRight: 'auto' }}>
                        Create a group to start organizing tournaments with your friends.
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary"
                    >
                        <Plus size={18} />
                        Create your first group
                    </button>
                </div>
            ) : (
                <div className="grid-3">
                    {groups.map((item) => (
                        <Link
                            key={item.groups.id}
                            to={`/groups/${item.groups.id}`}
                            className="card card-hover"
                            style={{ textDecoration: 'none', display: 'block' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                <div className="avatar avatar-lg">
                                    {item.groups.image_url ? (
                                        <img src={item.groups.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                    ) : (
                                        item.groups.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        marginBottom: '4px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {item.groups.name}
                                    </h3>
                                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                        {item.role === 'admin' ? '👑 Admin' : 'Member'}
                                    </p>
                                </div>
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingTop: '12px',
                                borderTop: '1px solid var(--border-color)'
                            }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>View details</span>
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                                    <path d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Create Group Modal */}
            {showCreateModal && (
                <>
                    <div className="modal-backdrop" onClick={() => setShowCreateModal(false)} />
                    <div className="modal-container">
                        <div className="card modal-content">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <div>
                                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                        Create New Group
                                    </h2>
                                    <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                                        Start organizing tournaments with friends
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)'
                                    }}
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateGroup}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        marginBottom: '8px',
                                        color: 'var(--text-primary)'
                                    }}>
                                        Group Name
                                    </label>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="e.g., Weekend Warriors"
                                        className="input-field"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        maxLength={50}
                                    />
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                                        Choose a memorable name for your badminton group
                                    </p>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    justifyContent: 'flex-end',
                                    paddingTop: '20px',
                                    borderTop: '1px solid var(--border-color)'
                                }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating || !newGroupName.trim()}
                                        className="btn-primary"
                                    >
                                        {creating ? (
                                            <>
                                                <Loader2 className="animate-spin" size={16} />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={16} />
                                                Create Group
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Groups;
