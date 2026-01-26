import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { ArrowLeft, Users, Loader2 } from 'lucide-react';
import { GroupService } from '../services/GroupService';
import { MatchService } from '../services/MatchService';
import { supabase } from '../lib/supabase';

const CreateMatch = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [group, setGroup] = useState(null);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    const [teamAId, setTeamAId] = useState('');
    const [teamBId, setTeamBId] = useState('');
    const [scoringType, setScoringType] = useState('standard_21');

    useEffect(() => {
        fetchData();
    }, [groupId]);

    const fetchData = async () => {
        try {
            const groupData = await GroupService.getGroupById(groupId);
            setGroup(groupData);

            // Get all teams from all tournaments in this group
            const { data: teamsData, error } = await supabase
                .from('teams')
                .select(`
                    *,
                    tournament:tournaments!inner(group_id),
                    team_members(
                        players(id, full_name, email)
                    )
                `)
                .eq('tournaments.group_id', groupId);

            if (error) throw error;
            setTeams(teamsData || []);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!teamAId || !teamBId) return;
        if (teamAId === teamBId) {
            alert('Please select different teams');
            return;
        }

        setCreating(true);
        try {
            const match = await GroupService.createStandaloneMatch({
                groupId,
                teamAId,
                teamBId,
                scoringType
            });

            navigate(`/matches/${match.id}`);
        } catch (err) {
            console.error('Error creating match:', err);
            alert('Failed to create match');
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent-primary)' }} />
            </div>
        );
    }

    return (
        <div>
            <button onClick={() => navigate(`/groups/${groupId}`)} className="btn-secondary" style={{ marginBottom: '24px' }}>
                <ArrowLeft size={18} />
                Back to Group
            </button>

            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                    <div style={{
                        padding: '12px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)'
                    }}>
                        <Users size={28} style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>
                            Create Standalone Match
                        </h1>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                            Set up a match for {group?.name}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleCreate}>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                            Team A
                        </label>
                        <select
                            className="select-field"
                            value={teamAId}
                            onChange={(e) => setTeamAId(e.target.value)}
                            required
                        >
                            <option value="">Select Team A</option>
                            {teams.map((team) => (
                                <option key={team.id} value={team.id}>
                                    {team.name} ({team.team_members?.map(tm => tm.players?.full_name || tm.players?.email).join(', ')})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                            Team B
                        </label>
                        <select
                            className="select-field"
                            value={teamBId}
                            onChange={(e) => setTeamBId(e.target.value)}
                            required
                        >
                            <option value="">Select Team B</option>
                            {teams.map((team) => (
                                <option key={team.id} value={team.id} disabled={team.id === teamAId}>
                                    {team.name} ({team.team_members?.map(tm => tm.players?.full_name || tm.players?.email).join(', ')})
                                </option>
                            ))}
                        </select>
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
                            <option value="single_21">Single Set (21 points)</option>
                            <option value="single_30">Single Set (30 points)</option>
                        </select>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                            Choose the scoring format for this match
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
                        <span style={{ fontSize: '20px' }}>ℹ️</span>
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                            This will be a standalone match (not part of any tournament).
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                        <button type="button" onClick={() => navigate(`/groups/${groupId}`)} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={creating || !teamAId || !teamBId} className="btn-primary">
                            {creating ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Users size={16} />
                                    Create Match
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateMatch;
