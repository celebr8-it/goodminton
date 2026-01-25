import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { ArrowLeft, Trophy, Loader2, X } from 'lucide-react';

const CreateTournament = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    // Form state
    const [tournamentName, setTournamentName] = useState('');
    const [scoringType, setScoringType] = useState('standard_21');

    useEffect(() => {
        fetchGroupData();
    }, [groupId]);

    const fetchGroupData = async () => {
        try {
            const { data: groupData } = await supabase
                .from('groups')
                .select('*')
                .eq('id', groupId)
                .single();
            setGroup(groupData);

            const { data: membersData } = await supabase
                .from('group_members')
                .select('players(id, full_name, email)')
                .eq('group_id', groupId);
            setMembers(membersData?.map(m => m.players) || []);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!tournamentName.trim()) return;
        setCreating(true);

        try {
            const { data: tournament, error } = await supabase
                .from('tournaments')
                .insert([{
                    group_id: groupId,
                    name: tournamentName,
                    scoring_type: scoringType,
                    status: 'draft'
                }])
                .select()
                .single();

            if (error) throw error;
            navigate(`/tournaments/${tournament.id}`);
        } catch (err) {
            console.error('Error creating tournament:', err);
            alert('Failed to create tournament');
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin" size={40} style={{ color: 'var(--accent-primary)' }} />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <button
                onClick={() => navigate(`/groups/${groupId}`)}
                className="flex items-center gap-2 mb-6 font-medium"
                style={{ color: 'var(--accent-primary)' }}
            >
                <ArrowLeft size={20} />
                Back to {group?.name}
            </button>

            <div className="card">
                <div className="flex items-center gap-4 mb-6 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(65, 105, 225, 0.1)' }}>
                        <Trophy size={28} style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Create Tournament</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Set up a new tournament for {group?.name}</p>
                    </div>
                </div>

                <form onSubmit={handleCreate} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                            Tournament Name
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., Summer Championship 2025"
                            className="input-field"
                            value={tournamentName}
                            onChange={(e) => setTournamentName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                            Scoring Type
                        </label>
                        <select
                            className="select-field"
                            value={scoringType}
                            onChange={(e) => setScoringType(e.target.value)}
                        >
                            <option value="standard_21">Standard (Best of 3, 21 points)</option>
                            <option value="single_30">Single Set (30 points)</option>
                            <option value="custom">Custom</option>
                        </select>
                        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                            Standard badminton scoring is best of 3 sets, first to 21 points.
                        </p>
                    </div>

                    <div className="pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                            👥 {members.length} members available for team generation
                        </p>

                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => navigate(`/groups/${groupId}`)}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={creating || !tournamentName.trim()}
                                className="btn-primary flex items-center gap-2"
                            >
                                {creating ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Tournament'
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTournament;
