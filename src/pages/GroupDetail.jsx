import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { ArrowLeft, UserPlus, Trophy, Copy, Check, Plus } from 'lucide-react';

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

    // Generate simple join code from group ID
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
        return <div className="text-center py-12">Loading...</div>;
    }

    if (!group) {
        return <div className="text-center text-muted py-12">Group not found</div>;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <button
                onClick={() => navigate('/groups')}
                className="flex items-center gap-2 text-primary hover:text-primary-dark mb-6 font-medium"
            >
                <ArrowLeft size={20} />
                Back to Groups
            </button>

            {/* Group Header */}
            <div className="card mb-6">
                <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
                        {group.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-text">{group.name}</h1>
                        <p className="text-muted">{members.length} members • Code: {joinCode}</p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <UserPlus size={20} />
                            Invite
                        </button>
                    )}
                </div>
            </div>

            {/* Tournaments Section */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-text">Tournaments</h2>
                    {isAdmin && (
                        <button
                            onClick={() => navigate(`/groups/${groupId}/create-tournament`)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus size={20} />
                            New Tournament
                        </button>
                    )}
                </div>

                {tournaments.length === 0 ? (
                    <div className="card text-center py-12">
                        <Trophy className="mx-auto text-muted mb-3" size={48} />
                        <p className="text-muted">No tournaments yet. Create one to get started!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tournaments.map((tournament) => (
                            <div
                                key={tournament.id}
                                onClick={() => navigate(`/tournaments/${tournament.id}`)}
                                className="card card-hover cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-text mb-1">{tournament.name}</h3>
                                        <p className="text-sm text-muted">Scoring: {tournament.scoring_type?.replace('_', ' ')}</p>
                                    </div>
                                    <Trophy className="text-primary" size={24} />
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${tournament.status === 'active' ? 'bg-success-light text-success' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {tournament.status === 'active' ? 'Active' : tournament.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <>
                    <div
                        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
                        onClick={() => setShowInviteModal(false)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
                        <div className="card w-full max-w-md pointer-events-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-text">Invite Members</h2>
                                <button
                                    onClick={() => setShowInviteModal(false)}
                                    className="text-muted hover:text-text"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm text-muted mb-3">Share this join code with your friends:</p>
                                <div className="flex items-center gap-3 bg-primary/5 p-4 rounded-xl border border-primary/20">
                                    <span className="text-2xl font-bold text-primary flex-1">{joinCode}</span>
                                    <button
                                        onClick={handleCopyCode}
                                        className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                                    >
                                        {copied ? <Check className="text-success" size={20} /> : <Copy className="text-primary" size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div className="border-t border-border pt-6">
                                <p className="text-sm font-medium text-text mb-3">Or invite by email</p>
                                <form onSubmit={handleAddMember} className="space-y-4">
                                    <input
                                        type="email"
                                        placeholder="friend@example.com"
                                        className="input-field"
                                        value={newMemberEmail}
                                        onChange={(e) => setNewMemberEmail(e.target.value)}
                                    />
                                    <p className="text-xs text-muted">
                                        The user must have an account to be added.
                                    </p>
                                    <button
                                        type="submit"
                                        disabled={adding || !newMemberEmail.trim()}
                                        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {adding ? 'Sending...' : 'Send Invite'}
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
