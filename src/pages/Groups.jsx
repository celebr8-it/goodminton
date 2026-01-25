import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Plus, Users, Loader2, Crown, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
        <div className="space-y-6 pb-20">
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-center"
            >
                <div>
                    <h1 className="text-3xl font-bold text-white">My Groups</h1>
                    <p className="text-sm text-muted mt-1">Manage your badminton circles</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowCreateModal(true)}
                    className="p-3 bg-gradient-to-r from-primary to-blue-600 rounded-full hover:shadow-lg hover:shadow-primary/30 transition-all"
                >
                    <Plus className="text-white" size={24} />
                </motion.button>
            </motion.header>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : groups.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card flex flex-col items-center py-16 text-center space-y-4"
                >
                    <motion.div
                        animate={{
                            y: [0, -10, 0],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="bg-gradient-to-br from-surface to-background p-6 rounded-full border border-white/10"
                    >
                        <Users size={48} className="text-muted" />
                    </motion.div>
                    <div>
                        <h3 className="text-xl font-semibold text-white">No groups yet</h3>
                        <p className="text-sm text-muted max-w-[250px] mx-auto mt-2">
                            Create a group to start organizing epic tournaments with your friends.
                        </p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-primary to-blue-600 rounded-lg text-sm font-medium text-white shadow-lg shadow-primary/20 mt-4"
                    >
                        Create your first group
                    </motion.button>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid gap-4"
                >
                    {groups.map((item, index) => (
                        <motion.div
                            key={item.groups.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link
                                to={`/groups/${item.groups.id}`}
                                className="glass-card hover:bg-white/5 transition-all flex items-center gap-4 group relative overflow-hidden"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-white/10 text-xl font-bold text-white relative"
                                >
                                    {item.groups.image_url ? (
                                        <img src={item.groups.image_url} alt="" className="h-full w-full object-cover rounded-xl" />
                                    ) : (
                                        item.groups.name.charAt(0).toUpperCase()
                                    )}
                                </motion.div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-white group-hover:text-primary transition-colors flex items-center gap-2">
                                        {item.groups.name}
                                        {item.role === 'admin' && (
                                            <Crown size={16} className="text-accent" />
                                        )}
                                    </h3>
                                    <p className="text-xs text-muted">
                                        {item.role === 'admin' ? 'Group Admin' : 'Member'}
                                    </p>
                                </div>
                                <ChevronRight className="text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" size={20} />
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowCreateModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
                        >
                            <div className="glass-card w-full max-w-sm space-y-4 bg-[#1e293b] pointer-events-auto">
                                <h2 className="text-2xl font-bold text-white">Create New Group</h2>
                                <form onSubmit={handleCreateGroup} className="space-y-4">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Group Name (e.g. Weekend Warriors)"
                                        className="w-full p-3 bg-background border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                    />
                                    <div className="flex gap-3 justify-end pt-2">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            type="button"
                                            onClick={() => setShowCreateModal(false)}
                                            className="px-4 py-2 text-sm font-medium text-muted hover:text-white transition-colors"
                                        >
                                            Cancel
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            type="submit"
                                            disabled={creating || !newGroupName.trim()}
                                            className="px-6 py-2 bg-gradient-to-r from-primary to-blue-600 rounded-lg text-sm font-medium text-white shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {creating ? 'Creating...' : 'Create Group'}
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

export default Groups;
