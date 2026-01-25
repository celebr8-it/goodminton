import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { ArrowLeft, Trophy, Users, Play, Shuffle, Loader2, Plus, X, Trash2 } from 'lucide-react';

const TournamentDetail = () => {
    const { tournamentId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [tournament, setTournament] = useState(null);
    const [teams, setTeams] = useState([]);
    const [matches, setMatches] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [showAddTeamModal, setShowAddTeamModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [creatingTeam, setCreatingTeam] = useState(false);

    useEffect(() => {
        fetchTournamentData();
    }, [tournamentId]);

    const fetchTournamentData = async () => {
        try {
            const { data: tournamentData } = await supabase
                .from('tournaments')
                .select('*, groups(*)')
                .eq('id', tournamentId)
                .single();
            setTournament(tournamentData);

            const { data: teamsData } = await supabase
                .from('teams')
                .select('*, team_members(player_id, players(id, full_name, email))')
                .eq('tournament_id', tournamentId);
            setTeams(teamsData || []);

            const { data: matchesData } = await supabase
                .from('matches')
                .select('*, match_sets(*), team_a:teams!matches_team_a_id_fkey(*), team_b:teams!matches_team_b_id_fkey(*)')
                .eq('tournament_id', tournamentId);
            setMatches(matchesData || []);

            if (tournamentData?.group_id) {
                const { data: membersData } = await supabase
                    .from('group_members')
                    .select('players(id, full_name, email)')
                    .eq('group_id', tournamentData.group_id);
                setMembers(membersData?.map(m => m.players) || []);
            }
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const generateRandomTeams = async () => {
        if (members.length < 4) {
            alert('Need at least 4 members to generate teams!');
            return;
        }
        setGenerating(true);

        try {
            // Delete existing teams first
            await supabase.from('teams').delete().eq('tournament_id', tournamentId);

            const shuffled = [...members].sort(() => Math.random() - 0.5);
            const teamPairs = [];
            for (let i = 0; i < shuffled.length; i += 2) {
                if (i + 1 < shuffled.length) {
                    teamPairs.push([shuffled[i], shuffled[i + 1]]);
                }
            }

            for (let i = 0; i < teamPairs.length; i++) {
                const pair = teamPairs[i];
                const teamName = `Team ${String.fromCharCode(65 + i)}`;

                const { data: team, error: teamError } = await supabase
                    .from('teams')
                    .insert([{ tournament_id: tournamentId, name: teamName }])
                    .select()
                    .single();

                if (teamError) throw teamError;

                for (const player of pair) {
                    await supabase
                        .from('team_members')
                        .insert([{ team_id: team.id, player_id: player.id }]);
                }
            }

            fetchTournamentData();
        } catch (err) {
            console.error('Error generating teams:', err);
            alert('Failed to generate teams');
        } finally {
            setGenerating(false);
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        if (!newTeamName.trim() || selectedMembers.length === 0) return;
        setCreatingTeam(true);

        try {
            const { data: team, error: teamError } = await supabase
                .from('teams')
                .insert([{ tournament_id: tournamentId, name: newTeamName }])
                .select()
                .single();

            if (teamError) throw teamError;

            for (const playerId of selectedMembers) {
                await supabase
                    .from('team_members')
                    .insert([{ team_id: team.id, player_id: playerId }]);
            }

            setNewTeamName('');
            setSelectedMembers([]);
            setShowAddTeamModal(false);
            fetchTournamentData();
        } catch (err) {
            console.error('Error creating team:', err);
            alert('Failed to create team');
        } finally {
            setCreatingTeam(false);
        }
    };

    const toggleMemberSelection = (playerId) => {
        setSelectedMembers(prev =>
            prev.includes(playerId)
                ? prev.filter(id => id !== playerId)
                : [...prev, playerId]
        );
    };

    const startTournament = async () => {
        if (teams.length < 2) {
            alert('Need at least 2 teams to start!');
            return;
        }

        try {
            for (let i = 0; i < teams.length; i++) {
                for (let j = i + 1; j < teams.length; j++) {
                    await supabase
                        .from('matches')
                        .insert([{
                            tournament_id: tournamentId,
                            team_a_id: teams[i].id,
                            team_b_id: teams[j].id
                        }]);
                }
            }

            await supabase
                .from('tournaments')
                .update({ status: 'active' })
                .eq('id', tournamentId);

            fetchTournamentData();
        } catch (err) {
            console.error('Error starting tournament:', err);
        }
    };

    const deleteTeam = async (teamId) => {
        if (!confirm('Delete this team?')) return;
        try {
            await supabase.from('teams').delete().eq('id', teamId);
            fetchTournamentData();
        } catch (err) {
            console.error('Error deleting team:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin" size={40} style={{ color: 'var(--accent-primary)' }} />
            </div>
        );
    }

    if (!tournament) {
        return <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Tournament not found</div>;
    }

    const assignedPlayerIds = teams.flatMap(t => t.team_members?.map(tm => tm.player_id) || []);
    const availableMembers = members.filter(m => !assignedPlayerIds.includes(m.id));

    return (
        <div className="max-w-4xl mx-auto">
            <button
                onClick={() => navigate(`/groups/${tournament.group_id}`)}
                className="flex items-center gap-2 mb-6 font-medium"
                style={{ color: 'var(--accent-primary)' }}
            >
                <ArrowLeft size={20} />
                Back to {tournament.groups?.name}
            </button>

            {/* Tournament Header */}
            <div className="card mb-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-2xl" style={{ backgroundColor: 'rgba(65, 105, 225, 0.1)' }}>
                            <Trophy size={32} style={{ color: 'var(--accent-primary)' }} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                                {tournament.name}
                            </h1>
                            <p style={{ color: 'var(--text-muted)' }}>
                                Scoring: {tournament.scoring_type?.replace('_', ' ')}
                            </p>
                        </div>
                    </div>
                    <span
                        className="px-4 py-1.5 rounded-full text-sm font-medium"
                        style={{
                            backgroundColor: tournament.status === 'active' ? '#D1FAE5' : 'rgba(65, 105, 225, 0.1)',
                            color: tournament.status === 'active' ? '#10B981' : 'var(--accent-primary)'
                        }}
                    >
                        {tournament.status === 'active' ? '🟢 Active' : '📝 Draft'}
                    </span>
                </div>
            </div>

            {/* Teams Section */}
            <div className="card mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Users size={22} />
                        Teams ({teams.length})
                    </h2>
                    {tournament.status === 'draft' && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowAddTeamModal(true)}
                                className="btn-secondary flex items-center gap-2 text-sm"
                            >
                                <Plus size={16} />
                                Add Team
                            </button>
                            <button
                                onClick={generateRandomTeams}
                                disabled={generating || members.length < 4}
                                className="btn-primary flex items-center gap-2 text-sm"
                            >
                                {generating ? <Loader2 className="animate-spin" size={16} /> : <Shuffle size={16} />}
                                Random Teams
                            </button>
                        </div>
                    )}
                </div>

                {teams.length === 0 ? (
                    <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
                        <Users size={48} className="mx-auto mb-3 opacity-40" />
                        <p className="mb-2">No teams yet</p>
                        <p className="text-sm">Add teams manually or generate random teams</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {teams.map((team) => (
                            <div
                                key={team.id}
                                className="p-4 rounded-xl relative group"
                                style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                            >
                                {tournament.status === 'draft' && (
                                    <button
                                        onClick={() => deleteTeam(team.id)}
                                        className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                                <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                                    {team.name}
                                </h3>
                                <div className="space-y-2">
                                    {team.team_members?.map((tm) => (
                                        <div key={tm.player_id} className="flex items-center gap-2">
                                            <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                                style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-dark))' }}>
                                                {tm.players?.full_name?.charAt(0) || tm.players?.email?.charAt(0)}
                                            </div>
                                            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                                {tm.players?.full_name || tm.players?.email}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {tournament.status === 'draft' && teams.length >= 2 && (
                    <button
                        onClick={startTournament}
                        className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
                    >
                        <Play size={18} />
                        Start Tournament ({teams.length} teams, {teams.length * (teams.length - 1) / 2} matches)
                    </button>
                )}
            </div>

            {/* Matches Section */}
            {matches.length > 0 && (
                <div className="card">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Trophy size={22} />
                        Matches ({matches.length})
                    </h2>
                    <div className="space-y-4">
                        {matches.map((match) => (
                            <div
                                key={match.id}
                                className="p-4 rounded-xl cursor-pointer transition-all hover:shadow-md"
                                style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            {match.team_a?.name}
                                        </p>
                                    </div>
                                    <div className="px-4">
                                        <span className="text-sm font-semibold px-3 py-1 rounded-full"
                                            style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                                            VS
                                        </span>
                                    </div>
                                    <div className="flex-1 text-right">
                                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            {match.team_b?.name}
                                        </p>
                                    </div>
                                </div>
                                {match.winner_team_id && (
                                    <div className="mt-2 pt-2 text-center text-sm" style={{ borderTop: '1px solid var(--border-color)', color: '#10B981' }}>
                                        Winner: {match.winner_team_id === match.team_a_id ? match.team_a?.name : match.team_b?.name}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add Team Modal */}
            {showAddTeamModal && (
                <>
                    <div
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowAddTeamModal(false)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
                        <div className="card w-full max-w-md pointer-events-auto max-h-[80vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Create Team</h2>
                                <button
                                    onClick={() => setShowAddTeamModal(false)}
                                    className="p-2 rounded-lg"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateTeam} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                                        Team Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Team Alpha"
                                        className="input-field"
                                        value={newTeamName}
                                        onChange={(e) => setNewTeamName(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                                        Select Players ({selectedMembers.length} selected)
                                    </label>
                                    <div className="space-y-2 max-h-48 overflow-y-auto p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                                        {availableMembers.length === 0 ? (
                                            <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                                                All members are already in teams
                                            </p>
                                        ) : (
                                            availableMembers.map((member) => (
                                                <label
                                                    key={member.id}
                                                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors"
                                                    style={{ backgroundColor: selectedMembers.includes(member.id) ? 'rgba(65, 105, 225, 0.1)' : 'transparent' }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedMembers.includes(member.id)}
                                                        onChange={() => toggleMemberSelection(member.id)}
                                                        className="w-4 h-4"
                                                    />
                                                    <span style={{ color: 'var(--text-primary)' }}>
                                                        {member.full_name || member.email}
                                                    </span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddTeamModal(false)}
                                        className="btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creatingTeam || !newTeamName.trim() || selectedMembers.length === 0}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        {creatingTeam ? <Loader2 className="animate-spin" size={18} /> : null}
                                        {creatingTeam ? 'Creating...' : 'Create Team'}
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

export default TournamentDetail;
