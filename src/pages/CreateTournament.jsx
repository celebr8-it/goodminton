import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { ArrowLeft, Trophy, Loader2 } from 'lucide-react';

const CreateTournament = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

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
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                <Loader2 className="animate-spin" size={36} style={{ color: 'var(--accent-primary)' }} />
            </div>
        );
    }

    return (
        <div>
            {/* Back Button */}
            <button onClick={() => navigate(`/groups/${groupId}`)} className="back-button">
                <ArrowLeft size={18} />
                Back to {group?.name}
            </button>

            {/* Form Card */}
            <div className="card" style={{ maxWidth: '560px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{
                        padding: '16px',
                        borderRadius: '14px',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)'
                    }}>
                        <Trophy size={28} style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>
                            Create Tournament
                        </h1>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                            Set up a new tournament for {group?.name}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleCreate}>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
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

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                            Scoring Type
                        </label>
                        <select
                            className="select-field"
                            value={scoringType}
                            onChange={(e) => setScoringType(e.target.value)}
                        >
                            <option value="standard_21">Standard (Best of 3, 21 points)</option>
                            <option value="single_30">Single Set (30 points)</option>
                            <option value="quick_15">Quick Match (15 points)</option>
                        </select>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                            Standard badminton scoring is best of 3 sets, first to 21 points.
                        </p>
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(79, 70, 229, 0.05)',
                        marginBottom: '24px'
                    }}>
                        <span style={{ fontSize: '20px' }}>👥</span>
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                            {members.length} members available for team generation
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                        <button type="button" onClick={() => navigate(`/groups/${groupId}`)} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={creating || !tournamentName.trim()} className="btn-primary">
                            {creating ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    Creating...
                                </>
                            ) : (
                                'Create Tournament'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTournament;
