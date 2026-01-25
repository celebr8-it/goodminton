import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { ArrowLeft, UserPlus, Trophy, Users, Crown, Loader2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GroupDetail = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddMember, setShowAddMember] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchGroupData();
    }, [groupId]);

    const fetchGroupData = async () => {
        try {
            // Fetch group details
            const { data: groupData, error: groupError } = await supabase
                .from('groups')
                .select('*')
                .eq('id', groupId)
                .single();

            if (groupError) throw groupError;
            setGroup(groupData);

            // Fetch members
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

            // Fetch tournaments
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

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!newMemberEmail.trim()) return;
        setAdding(true);

        try {
            // Find player by email
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

            // Add to group
            const { error: memberError } = await supabase
                .from('group_members')
                .insert([{ group_id: groupId, player_id: playerData.id, role: 'member' }]);

            if (memberError) throw memberError;

            setNewMemberEmail('');
            setShowAddMember(false);
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
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (!group) {
        return <div className="text-center text-muted py-12">Group not found</div>;
    }

    return (
        <div className="space-y-6 pb-20">
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4"
            >
                <button
                    onClick={() => navigate('/groups')}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                    <ArrowLeft className="text-muted" size={24} />
                </button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white">{group.name}</h1>
                    <p className="text-sm text-muted mt-1">{members.length} members</p>
                </div>
            </motion.header>

            {/* Members Section */}
            <div className="glass-card space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Users size={20} />
                        Members
                    </h2>
                    {isAdmin && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowAddMember(true)}
                            className="p-2 bg-primary/20 rounded-lg hover:bg-primary/30 transition-colors"
                        >
                            <UserPlus size={20} className="text-primary" />
                        </motion.button>
                    )}
                </div>

                <div className="space-y-2">
                    {members.map((member, index) => (
                        <motion.div
                            key={member.players.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-3 p-3 bg-surface/50 rounded-lg"
                        >
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold text-white">
                                {member.players.avatar_url ? (
                                    <img src={member.players.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                                ) : (
                                    member.players.full_name?.charAt(0).toUpperCase() || 'P'
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-white font-medium">{member.players.full_name || 'Player'}</p>
                                <p className="text-xs text-muted">{member.players.email}</p>
                            </div>
                            {member.role === 'admin' && (
                                <Crown size={16} className="text-accent" />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Tournaments Section */}
            <div className="glass-card space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Trophy size={20} />
                        Tournaments
                    </h2>
                    {isAdmin && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(`/groups/${groupId}/create-tournament`)}
                            className="px-4 py-2 bg-gradient-to-r from-primary to-blue-600 rounded-lg text-sm font-medium text-white shadow-lg shadow-primary/20"
                        >
                            <Plus size={16} className="inline mr-1" />
                            New Tournament
                        </motion.button>
                    )}
                </div>

                {tournaments.length === 0 ? (
                    <div className="text-center py-8 text-muted">
                        No tournaments yet. Create one to get started!
                    </div>
                ) : (
                    <div className="space-y-2">
                        {tournaments.map((tournament, index) => (
                            <motion.div
                                key={tournament.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => navigate(`/tournaments/${tournament.id}`)}
                                className="p-4 bg-surface/50 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <h3 className="font-semibold text-white">{tournament.name}</h3>
                                <p className="text-xs text-muted mt-1">
                                    Status: <span className="capitalize">{tournament.status}</span>
                                </p>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Member Modal */}
            <AnimatePresence>
                {showAddMember && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowAddMember(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
                        >
                            <div className="glass-card w-full max-w-sm space-y-4 bg-[#1e293b] pointer-events-auto">
                                <h2 className="text-2xl font-bold text-white">Add Member</h2>
                                <form onSubmit={handleAddMember} className="space-y-4">
                                    <input
                                        autoFocus
                                        type="email"
                                        placeholder="Member's email address"
                                        className="w-full p-3 bg-background border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                        value={newMemberEmail}
                                        onChange={(e) => setNewMemberEmail(e.target.value)}
                                    />
                                    <p className="text-xs text-muted">
                                        The user must have an account to be added to the group.
                                    </p>
                                    <div className="flex gap-3 justify-end pt-2">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            type="button"
                                            onClick={() => setShowAddMember(false)}
                                            className="px-4 py-2 text-sm font-medium text-muted hover:text-white transition-colors"
                                        >
                                            Cancel
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            type="submit"
                                            disabled={adding || !newMemberEmail.trim()}
                                            className="px-6 py-2 bg-gradient-to-r from-primary to-blue-600 rounded-lg text-sm font-medium text-white shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {adding ? 'Adding...' : 'Add Member'}
                                        </motion.button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GroupDetail;
