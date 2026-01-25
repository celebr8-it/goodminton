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
        <div className="max-w-5xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-text mb-2">My Groups</h1>
                    <p className="text-muted text-base">Manage your badminton circles</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap self-start sm:self-auto"
                >
                    <Plus size={20} strokeWidth={2.5} />
                    <span className="font-semibold">New Group</span>
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-primary" size={40} />
                </div>
            ) : groups.length === 0 ? (
                <div className="card text-center py-20 px-6">
                    <div className="bg-primary/10 p-8 rounded-3xl inline-flex mb-6">
                        <Users size={56} className="text-primary" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl font-bold text-text mb-3">No groups yet</h3>
                    <p className="text-muted text-lg max-w-md mx-auto mb-8">
                        Create a group to start organizing tournaments with your friends.
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Create your first group
                    </button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {groups.map((item) => (
                        <Link
                            key={item.groups.id}
                            to={`/groups/${item.groups.id}`}
                            className="card card-hover group cursor-pointer transition-all duration-200"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-2xl font-bold text-white shadow-lg flex-shrink-0">
                                    {item.groups.image_url ? (
                                        <img src={item.groups.image_url} alt="" className="h-full w-full object-cover rounded-2xl" />
                                    ) : (
                                        item.groups.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-text text-lg group-hover:text-primary transition-colors truncate">
                                        {item.groups.name}
                                    </h3>
                                    <p className="text-sm text-muted">
                                        {item.role === 'admin' ? '👑 Admin' : 'Member'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-border">
                                <span className="text-sm text-muted">View details</span>
                                <svg className="w-5 h-5 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Create Group Modal */}
            {showCreateModal && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fadeIn"
                        onClick={() => setShowCreateModal(false)}
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
                        <div className="card w-full max-w-lg pointer-events-auto animate-slideUp">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                                <div>
                                    <h2 className="text-2xl font-bold text-text">Create New Group</h2>
                                    <p className="text-sm text-muted mt-1">Start organizing tournaments with friends</p>
                                </div>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X size={24} className="text-muted" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleCreateGroup} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-text mb-3">
                                        Group Name
                                    </label>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="e.g., Weekend Warriors"
                                        className="input-field text-base"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        maxLength={50}
                                    />
                                    <p className="text-xs text-muted mt-2">
                                        Choose a memorable name for your badminton group
                                    </p>
                                </div>

                                {/* Modal Footer */}
                                <div className="flex gap-3 justify-end pt-4 border-t border-border">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="btn-secondary px-6"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating || !newGroupName.trim()}
                                        className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {creating ? (
                                            <>
                                                <Loader2 className="animate-spin" size={18} />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={18} />
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

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
                .animate-slideUp {
                    animation: slideUp 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default Groups;
