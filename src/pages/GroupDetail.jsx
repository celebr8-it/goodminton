import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { ArrowLeft, UserPlus, Trophy, Copy, Check, Plus, Users, Crown, X, Loader2 } from 'lucide-react';

const GroupDetail = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [adding, setAdding] = useState(false);
    const [copied, setCopied] = useState(false);

    const joinCode = groupId ? groupId.substring(0, 6).toUpperCase() : '';

    useEffect(() => {
        fetchGroupData();
    }, [groupId]);

    const fetchGroupData = async () => {
        try {
            const { data: groupData, error: groupError } = await supabase
                .from('groups')
                .select('*')
                .eq('id', groupId)
                .single();

            if (groupError) throw groupError;
            setGroup(groupData);

            const { data: membersData, error: membersError } = await supabase
                .from('group_members')
                .select(`
                    role,
                    players (
                        id,
                        full_name,
                        email,
                        avatar_url
                    )
                `)
                .eq('group_id', groupId);

            if (membersError) throw membersError;
            setMembers(membersData || []);

            const { data: tournamentsData, error: tournamentsError } = await supabase
                .from('tournaments')
                .select('*')
                .eq('group_id', groupId)
                .order('created_at', { ascending: false });

            if (tournamentsError) throw tournamentsError;
            setTournaments(tournamentsData || []);
        } catch (err) {
            console.error('Error fetching group data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(joinCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!newMemberEmail.trim()) return;
        setAdding(true);

        try {
            const { data: playerData, error: playerError } = await supabase
                .from('players')
                .select('id')
                .eq('email', newMemberEmail.toLowerCase())
                .single();

            if (playerError || !playerData) {
                alert('User not found. They need to sign up first!');
                setAdding(false);
                return;
            }

            const { error: memberError } = await supabase
                .from('group_members')
                .insert([{ group_id: groupId, player_id: playerData.id, role: 'member' }]);

            if (memberError) throw memberError;

            setNewMemberEmail('');
            setShowInviteModal(false);
            fetchGroupData();
        } catch (err) {
            console.error('Error adding member:', err);
            alert('Failed to add member');
        } finally {
            setAdding(false);
        }
    };

    const isAdmin = group && group.owner_id === user?.id;

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                <Loader2 className="animate-spin" size={36} style={{ color: 'var(--accent-primary)' }} />
            </div>
        );
    }

    if (!group) {
        return <div className="empty-state">Group not found</div>;
    }

    return (
        <div>
            {/* Back Button */}
            <button onClick={() => navigate('/groups')} className="back-button">
                <ArrowLeft size={18} />
                Back to Groups
            </button>

            {/* Group Header */}
            <div className="card section-gap">
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px' }}>
                    <div className="avatar avatar-xl">{group.name.charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>
                            {group.name}
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                            {members.length} members • Code: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{joinCode}</span>
                        </p>
                    </div>
                    {isAdmin && (
                        <button onClick={() => setShowInviteModal(true)} className="btn-primary">
                            <UserPlus size={18} />
                            Invite
                        </button>
                    )}
                </div>
            </div>

            {/* Members Section */}
            <div className="card section-gap">
                <h2 className="section-title" style={{ marginBottom: '16px' }}>
                    <Users size={20} />
                    Members ({members.length})
                </h2>
                <div className="grid-2">
                    {members.map((member) => (
                        <div key={member.players.id} className="item-row">
                            <div className="avatar avatar-md">
                                {member.players.avatar_url ? (
                                    <img src={member.players.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    member.players.full_name?.charAt(0).toUpperCase() || member.players.email?.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {member.players.full_name || 'Player'}
                                </p>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {member.players.email}
                                </p>
                            </div>
                            {member.role === 'admin' && <Crown size={16} style={{ color: '#F59E0B', flexShrink: 0 }} />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Tournaments Section */}
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <h2 className="section-title">
                        <Trophy size={20} />
                        Tournaments
                    </h2>
                    {isAdmin && (
                        <button onClick={() => navigate(`/groups/${groupId}/create-tournament`)} className="btn-primary">
                            <Plus size={16} />
                            New Tournament
                        </button>
                    )}
                </div>

                {tournaments.length === 0 ? (
                    <div className="empty-state">
                        <Trophy size={48} className="empty-state-icon" style={{ color: 'var(--accent-primary)' }} />
                        <p style={{ marginBottom: '4px' }}>No tournaments yet</p>
                        {isAdmin && <p style={{ fontSize: '13px' }}>Create one to get started!</p>}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {tournaments.map((tournament) => (
                            <div
                                key={tournament.id}
                                onClick={() => navigate(`/tournaments/${tournament.id}`)}
                                className="item-row card-hover"
                                style={{ cursor: 'pointer' }}
                            >
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                        {tournament.name}
                                    </h3>
                                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                        Scoring: {tournament.scoring_type?.replace('_', ' ')}
                                    </p>
                                </div>
                                <span className={tournament.status === 'active' ? 'badge badge-success' : 'badge badge-draft'}>
                                    {tournament.status === 'active' ? 'Active' : 'Draft'}
                                </span>
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
                                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <>
                    <div className="modal-backdrop" onClick={() => setShowInviteModal(false)} />
                    <div className="modal-container">
                        <div className="card modal-content">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Invite Members</h2>
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                    Share this join code with your friends:
                                </p>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(79, 70, 229, 0.08)',
                                    border: '1px solid rgba(79, 70, 229, 0.15)'
                                }}>
                                    <span style={{ flex: 1, fontSize: '24px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                                        {joinCode}
                                    </span>
                                    <button
                                        onClick={handleCopyCode}
                                        style={{
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            backgroundColor: copied ? '#D1FAE5' : 'rgba(79, 70, 229, 0.1)'
                                        }}
                                    >
                                        {copied ? <Check size={18} style={{ color: '#059669' }} /> : <Copy size={18} style={{ color: 'var(--accent-primary)' }} />}
                                    </button>
                                </div>
                            </div>

                            <div style={{ paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
                                <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
                                    Or invite by email
                                </p>
                                <form onSubmit={handleAddMember}>
                                    <input
                                        type="email"
                                        placeholder="friend@example.com"
                                        className="input-field"
                                        value={newMemberEmail}
                                        onChange={(e) => setNewMemberEmail(e.target.value)}
                                        style={{ marginBottom: '8px' }}
                                    />
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                        The user must have an account to be added.
                                    </p>
                                    <button type="submit" disabled={adding || !newMemberEmail.trim()} className="btn-primary" style={{ width: '100%' }}>
                                        {adding ? (
                                            <>
                                                <Loader2 className="animate-spin" size={16} />
                                                Adding...
                                            </>
                                        ) : (
                                            'Add Member'
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default GroupDetail;
