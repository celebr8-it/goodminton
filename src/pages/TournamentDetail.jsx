import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { ArrowLeft, Trophy, Users, Play, Shuffle, Loader2, Plus } from 'lucide-react';

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

    useEffect(() => {
        fetchTournamentData();
    }, [tournamentId]);

    const fetchTournamentData = async () => {
        try {
            // Fetch tournament
            const { data: tournamentData } = await supabase
                .from('tournaments')
                .select('*, groups(*)')
                .eq('id', tournamentId)
                .single();
            setTournament(tournamentData);

            // Fetch teams
            const { data: teamsData } = await supabase
                .from('teams')
                .select('*, team_members(player_id, players(id, full_name, email))')
                .eq('tournament_id', tournamentId);
            setTeams(teamsData || []);

            // Fetch matches
            const { data: matchesData } = await supabase
                .from('matches')
                .select('*, match_sets(*), team_a:teams!matches_team_a_id_fkey(*), team_b:teams!matches_team_b_id_fkey(*)')
                .eq('tournament_id', tournamentId);
            setMatches(matchesData || []);

            // Fetch group members for random team generation
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
            // Shuffle members
            const shuffled = [...members].sort(() => Math.random() - 0.5);

            // Create pairs (teams of 2)
            const teamPairs = [];
            for (let i = 0; i < shuffled.length; i += 2) {
                if (i + 1 < shuffled.length) {
                    teamPairs.push([shuffled[i], shuffled[i + 1]]);
                }
            }

            // Create teams in database
            for (let i = 0; i < teamPairs.length; i++) {
                const pair = teamPairs[i];
                const teamName = `Team ${String.fromCharCode(65 + i)}`; // Team A, B, C...

                const { data: team, error: teamError } = await supabase
                    .from('teams')
                    .insert([{ tournament_id: tournamentId, name: teamName }])
                    .select()
                    .single();

                if (teamError) throw teamError;

                // Add members to team
                for (const player of pair) {
                    await supabase
                        .from('team_members')
                        .insert([{ team_id: team.id, player_id: player.id }]);
                }
            }

            // Refresh data
            fetchTournamentData();
        } catch (err) {
            console.error('Error generating teams:', err);
            alert('Failed to generate teams');
        } finally {
            setGenerating(false);
        }
    };

    const startTournament = async () => {
        if (teams.length < 2) {
            alert('Need at least 2 teams to start!');
            return;
        }

        try {
            // Create matches (round-robin for now)
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

            // Update tournament status
            await supabase
                .from('tournaments')
                .update({ status: 'active' })
                .eq('id', tournamentId);

            fetchTournamentData();
        } catch (err) {
            console.error('Error starting tournament:', err);
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
                        <button
                            onClick={generateRandomTeams}
                            disabled={generating}
                            className="btn-primary flex items-center gap-2 text-sm"
                        >
                            {generating ? <Loader2 className="animate-spin" size={16} /> : <Shuffle size={16} />}
                            {generating ? 'Generating...' : 'Random Teams'}
                        </button>
                    )}
                </div>

                {teams.length === 0 ? (
                    <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                        <Users size={40} className="mx-auto mb-3 opacity-50" />
                        <p>No teams yet. Generate random teams to get started!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {teams.map((team) => (
                            <div
                                key={team.id}
                                className="p-4 rounded-xl"
                                style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                            >
                                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{team.name}</h3>
                                <div className="space-y-1">
                                    {team.team_members?.map((tm) => (
                                        <p key={tm.player_id} className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                            {tm.players?.full_name || tm.players?.email}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {tournament.status === 'draft' && teams.length >= 2 && (
                    <button
                        onClick={startTournament}
                        className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                    >
                        <Play size={18} />
                        Start Tournament
                    </button>
                )}
            </div>

            {/* Matches Section */}
            {matches.length > 0 && (
                <div className="card">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Trophy size={22} />
                        Matches
                    </h2>
                    <div className="space-y-4">
                        {matches.map((match) => (
                            <div
                                key={match.id}
                                className="p-4 rounded-xl"
                                style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 text-center">
                                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            {match.team_a?.name}
                                        </p>
                                    </div>
                                    <div className="px-4">
                                        <span className="text-sm font-semibold px-3 py-1 rounded-full"
                                            style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                                            VS
                                        </span>
                                    </div>
                                    <div className="flex-1 text-center">
                                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                            {match.team_b?.name}
                                        </p>
                                    </div>
                                </div>
                                {match.match_sets?.length > 0 && (
                                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                                        {match.match_sets.map((set) => (
                                            <div key={set.id} className="flex justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
                                                <span>Set {set.set_number}</span>
                                                <span>
                                                    <span style={{ color: set.score_team_a > set.score_team_b ? '#10B981' : 'inherit' }}>
                                                        {set.score_team_a}
                                                    </span>
                                                    {' - '}
                                                    <span style={{ color: set.score_team_b > set.score_team_a ? '#10B981' : 'inherit' }}>
                                                        {set.score_team_b}
                                                    </span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TournamentDetail;
