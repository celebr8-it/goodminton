/**
 * Tournament Detail Page (Refactored)
 * Uses service layer and hooks for better separation of concerns
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTournament } from '../hooks/useTournament';
import { useAuth } from '../lib/AuthContext';
import {
    ArrowLeft,
    Trophy,
    Users,
    Play,
    Shuffle,
    Loader2,
    Plus,
    Trash2,
    CheckCircle,
    TrendingUp,
    Eye
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal, { ModalFooter } from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { TOURNAMENT_STATUS } from '../lib/constants';

const TournamentDetailPage = () => {
    const { tournamentId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const {
        tournament,
        teams,
        matches,
        standings,
        loading,
        error,
        actionLoading,
        startTournament,
        completeTournament,
        getStatistics,
        refetch
    } = useTournament(tournamentId);

    const [members, setMembers] = useState([]);
    const [showAddTeamModal, setShowAddTeamModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [creatingTeam, setCreatingTeam] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);

    // Load group members
    React.useEffect(() => {
        if (tournament?.group_id) {
            loadGroupMembers();
        }
    }, [tournament?.group_id]);

    const loadGroupMembers = async () => {
        try {
            const { data } = await supabase
                .from('group_members')
                .select('players(id, full_name, email, avatar_url)')
                .eq('group_id', tournament.group_id);

            setMembers(data?.map(m => m.players) || []);
        } catch (err) {
            console.error('Error loading members:', err);
        }
    };

    /**
     * Generate random teams from group members
     */
    const generateRandomTeams = async () => {
        if (members.length < 4) {
            alert('Need at least 4 members to generate teams!');
            return;
        }

        setGenerating(true);
        try {
            // Delete existing teams
            await supabase.from('teams').delete().eq('tournament_id', tournamentId);

            // Shuffle and pair members
            const shuffled = [...members].sort(() => Math.random() - 0.5);
            const teamPairs = [];

            for (let i = 0; i < shuffled.length; i += 2) {
                if (i + 1 < shuffled.length) {
                    teamPairs.push([shuffled[i], shuffled[i + 1]]);
                }
            }

            // Create teams
            for (let i = 0; i < teamPairs.length; i++) {
                const pair = teamPairs[i];
                const teamName = `Team ${String.fromCharCode(65 + i)}`;

                const { data: team } = await supabase
                    .from('teams')
                    .insert([{ tournament_id: tournamentId, name: teamName }])
                    .select()
                    .single();

                for (const player of pair) {
                    await supabase
                        .from('team_members')
                        .insert([{ team_id: team.id, player_id: player.id }]);
                }
            }

            await refetch();
        } catch (err) {
            console.error('Error generating teams:', err);
            alert('Failed to generate teams');
        } finally {
            setGenerating(false);
        }
    };

    /**
     * Create a new team manually
     */
    const handleCreateTeam = async (e) => {
        e.preventDefault();
        if (!newTeamName.trim() || selectedMembers.length === 0) return;

        setCreatingTeam(true);
        try {
            const { data: team } = await supabase
                .from('teams')
                .insert([{ tournament_id: tournamentId, name: newTeamName }])
                .select()
                .single();

            for (const playerId of selectedMembers) {
                await supabase
                    .from('team_members')
                    .insert([{ team_id: team.id, player_id: playerId }]);
            }

            setNewTeamName('');
            setSelectedMembers([]);
            setShowAddTeamModal(false);
            await refetch();
        } catch (err) {
            console.error('Error creating team:', err);
            alert('Failed to create team');
        } finally {
            setCreatingTeam(false);
        }
    };

    /**
     * Delete a team
     */
    const deleteTeam = async (teamId) => {
        if (!confirm('Delete this team?')) return;

        try {
            await supabase.from('teams').delete().eq('id', teamId);
            await refetch();
        } catch (err) {
            console.error('Error deleting team:', err);
        }
    };

    /**
     * Handle tournament start
     */
    const handleStartTournament = async () => {
        try {
            const result = await startTournament();
            alert(`Tournament started! ${result.matchCount} matches generated.`);
        } catch (err) {
            alert(err.message);
        }
    };

    /**
     * Handle tournament completion
     */
    const handleCompleteTournament = async () => {
        try {
            await completeTournament();
            setShowCompleteModal(false);
            alert('Tournament completed successfully!');
        } catch (err) {
            alert(err.message);
        }
    };

    const toggleMemberSelection = (playerId) => {
        setSelectedMembers(prev =>
            prev.includes(playerId)
                ? prev.filter(id => id !== playerId)
                : [...prev, playerId]
        );
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!tournament) {
        return (
            <EmptyState
                icon={Trophy}
                title="Tournament not found"
                description="This tournament doesn't exist"
                action={{ label: 'Go Back', onClick: () => navigate(-1) }}
            />
        );
    }

    const assignedPlayerIds = teams.flatMap(t =>
        t.team_members?.map(tm => tm.player_id) || []
    );
    const availableMembers = members.filter(m => !assignedPlayerIds.includes(m.id));
    const stats = getStatistics();
    const isDraft = tournament.status === TOURNAMENT_STATUS.DRAFT;
    const isActive = tournament.status === TOURNAMENT_STATUS.ACTIVE;
    const isCompleted = tournament.status === TOURNAMENT_STATUS.COMPLETED;

    return (
        <div>
            {/* Back Button */}
            <button
                onClick={() => navigate(`/groups/${tournament.group_id}`)}
                className="back-button"
            >
                <ArrowLeft size={18} />
                Back to {tournament.group?.name}
            </button>

            {/* Tournament Header */}
            <div className="card section-gap">
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                    gap: '20px'
                }}>
                    <div style={{
                        padding: '20px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-hover))'
                    }}>
                        <Trophy size={32} style={{ color: 'white' }} />
                    </div>

                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <h1 style={{
                            fontSize: '24px',
                            fontWeight: 700,
                            marginBottom: '8px',
                            color: 'var(--text-primary)'
                        }}>
                            {tournament.name}
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                            Scoring: {tournament.scoring_type?.replace('_', ' ')}
                        </p>
                    </div>

                    <span className={
                        isCompleted ? 'badge badge-success' :
                            isActive ? 'badge badge-primary' :
                                'badge badge-draft'
                    }>
                        {isCompleted ? '✓ Completed' :
                            isActive ? '▶ Active' :
                                '○ Draft'}
                    </span>
                </div>

                {/* Statistics */}
                {(isActive || isCompleted) && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '16px',
                        marginTop: '20px',
                        padding: '16px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-secondary)'
                    }}>
                        <div>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Teams</p>
                            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {stats.totalTeams}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Matches</p>
                            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {stats.totalMatches}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Completed</p>
                            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success-color)' }}>
                                {stats.completedMatches}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Progress</p>
                            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                {stats.completionPercentage}%
                            </p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                {isActive && stats.pendingMatches === 0 && (
                    <button
                        onClick={() => setShowCompleteModal(true)}
                        disabled={actionLoading}
                        className="btn-success"
                        style={{ marginTop: '20px', width: '100%' }}
                    >
                        <CheckCircle size={18} />
                        Complete Tournament
                    </button>
                )}
            </div>

            {/* Standings (only show if active/completed) */}
            {(isActive || isCompleted) && standings.length > 0 && (
                <div className="card section-gap">
                    <h2 className="section-title" style={{ marginBottom: '20px' }}>
                        <TrendingUp size={20} />
                        Standings
                    </h2>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Rank</th>
                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Team</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>P</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>W</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>L</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Sets</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Points</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Pts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {standings.map((standing, index) => (
                                    <tr key={standing.team.id} style={{
                                        borderBottom: '1px solid var(--border-color)',
                                        backgroundColor: index === 0 ? 'rgba(34, 197, 94, 0.05)' : 'transparent'
                                    }}>
                                        <td style={{ padding: '12px', fontSize: '14px', fontWeight: 600 }}>
                                            {index + 1}
                                            {index === 0 && <Trophy size={16} style={{ color: 'var(--success-color)', marginLeft: '6px', display: 'inline' }} />}
                                        </td>
                                        <td style={{ padding: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {standing.team.name}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                                            {standing.matchesPlayed}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: 'var(--success-color)' }}>
                                            {standing.matchesWon}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                                            {standing.matchesLost}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                                            {standing.setsWon}-{standing.setsLost}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
                                            {standing.pointsWon}-{standing.pointsLost}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '16px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                            {standing.points}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Teams Section */}
            <div className="card section-gap">
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <h2 className="section-title">
                        <Users size={20} />
                        Teams ({teams.length})
                    </h2>

                    {isDraft && (
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => setShowAddTeamModal(true)}
                                className="btn-secondary"
                            >
                                <Plus size={16} />
                                Add Team
                            </button>
                            <button
                                onClick={generateRandomTeams}
                                disabled={generating || members.length < 4}
                                className="btn-primary"
                            >
                                {generating ? <Loader2 className="animate-spin" size={16} /> : <Shuffle size={16} />}
                                Random Teams
                            </button>
                        </div>
                    )}
                </div>

                {teams.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="No teams yet"
                        description="Add teams manually or generate random teams"
                    />
                ) : (
                    <div className="grid-2">
                        {teams.map((team) => (
                            <div
                                key={team.id}
                                className="item-row"
                                style={{
                                    flexDirection: 'column',
                                    alignItems: 'stretch',
                                    position: 'relative'
                                }}
                            >
                                {isDraft && (
                                    <button
                                        onClick={() => deleteTeam(team.id)}
                                        style={{
                                            position: 'absolute',
                                            top: '12px',
                                            right: '12px',
                                            padding: '6px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            color: '#EF4444'
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}

                                <h3 style={{
                                    fontWeight: 600,
                                    marginBottom: '12px',
                                    color: 'var(--text-primary)'
                                }}>
                                    {team.name}
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {team.team_members?.map((tm) => (
                                        <div
                                            key={tm.player_id}
                                            style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                                        >
                                            <div className="avatar avatar-sm">
                                                {tm.player?.full_name?.charAt(0) || tm.player?.email?.charAt(0)}
                                            </div>
                                            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                                                {tm.player?.full_name || tm.player?.email}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {isDraft && teams.length >= 2 && (
                    <button
                        onClick={handleStartTournament}
                        disabled={actionLoading}
                        className="btn-primary"
                        style={{ width: '100%', marginTop: '20px' }}
                    >
                        {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                        Start Tournament ({teams.length} teams, {teams.length * (teams.length - 1) / 2} matches)
                    </button>
                )}
            </div>

            {/* Matches Section */}
            {matches.length > 0 && (
                <div className="card">
                    <h2 className="section-title" style={{ marginBottom: '20px' }}>
                        <Trophy size={20} />
                        Matches ({matches.length})
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {matches.map((match) => {
                            const isMatchComplete = !!match.winner_team_id;
                            const isWinnerA = match.winner_team_id === match.team_a_id;

                            return (
                                <div
                                    key={match.id}
                                    className="item-row"
                                    style={{
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        position: 'relative'
                                    }}
                                    onClick={() => navigate(`/matches/${match.id}`)}
                                >
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <p style={{
                                            fontWeight: 600,
                                            color: isMatchComplete && isWinnerA ? 'var(--success-color)' : 'var(--text-primary)'
                                        }}>
                                            {match.team_a?.name}
                                            {isMatchComplete && isWinnerA && ' ✓'}
                                        </p>
                                    </div>

                                    <div style={{ padding: '0 16px' }}>
                                        <span className={isMatchComplete ? 'badge badge-success' : 'badge badge-draft'}>
                                            VS
                                        </span>
                                    </div>

                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <p style={{
                                            fontWeight: 600,
                                            color: isMatchComplete && !isWinnerA ? 'var(--success-color)' : 'var(--text-primary)'
                                        }}>
                                            {match.team_b?.name}
                                            {isMatchComplete && !isWinnerA && ' ✓'}
                                        </p>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/matches/${match.id}`);
                                        }}
                                        className="btn-secondary"
                                        style={{ marginLeft: '16px' }}
                                    >
                                        <Eye size={16} />
                                        {isMatchComplete ? 'View' : 'Record'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Add Team Modal */}
            <Modal
                isOpen={showAddTeamModal}
                onClose={() => setShowAddTeamModal(false)}
                title="Create Team"
                description="Add a new team to the tournament"
            >
                <form onSubmit={handleCreateTeam}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: 600,
                            marginBottom: '8px',
                            color: 'var(--text-primary)'
                        }}>
                            Team Name
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., Team Alpha"
                            className="input-field"
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: 600,
                            marginBottom: '8px',
                            color: 'var(--text-primary)'
                        }}>
                            Select Players ({selectedMembers.length} selected)
                        </label>

                        <div style={{
                            maxHeight: '200px',
                            overflow: 'auto',
                            padding: '12px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)'
                        }}>
                            {availableMembers.length === 0 ? (
                                <p style={{
                                    textAlign: 'center',
                                    padding: '20px',
                                    color: 'var(--text-muted)',
                                    fontSize: '14px'
                                }}>
                                    All members are already in teams
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {availableMembers.map((member) => (
                                        <label
                                            key={member.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '10px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                backgroundColor: selectedMembers.includes(member.id)
                                                    ? 'var(--accent-light)'
                                                    : 'transparent'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedMembers.includes(member.id)}
                                                onChange={() => toggleMemberSelection(member.id)}
                                                style={{ width: '18px', height: '18px' }}
                                            />
                                            <span style={{ color: 'var(--text-primary)' }}>
                                                {member.full_name || member.email}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <ModalFooter>
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
                            className="btn-primary"
                        >
                            {creatingTeam ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                            {creatingTeam ? 'Creating...' : 'Create Team'}
                        </button>
                    </ModalFooter>
                </form>
            </Modal>

            {/* Complete Tournament Modal */}
            <Modal
                isOpen={showCompleteModal}
                onClose={() => setShowCompleteModal(false)}
                title="Complete Tournament"
                description="Mark this tournament as complete? All matches must be finished."
            >
                <div style={{ padding: '20px 0' }}>
                    {standings.length > 0 && (
                        <div style={{
                            padding: '16px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-secondary)',
                            marginBottom: '20px'
                        }}>
                            <p style={{
                                fontSize: '16px',
                                fontWeight: 600,
                                color: 'var(--success-color)',
                                marginBottom: '8px'
                            }}>
                                🏆 Winner: {standings[0].team.name}
                            </p>
                            <p style={{
                                fontSize: '14px',
                                color: 'var(--text-muted)'
                            }}>
                                {standings[0].matchesWon} wins, {standings[0].points} points
                            </p>
                        </div>
                    )}
                </div>

                <ModalFooter>
                    <button
                        onClick={() => setShowCompleteModal(false)}
                        className="btn-secondary"
                        disabled={actionLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCompleteTournament}
                        className="btn-primary"
                        disabled={actionLoading}
                    >
                        {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                        {actionLoading ? 'Completing...' : 'Confirm Complete'}
                    </button>
                </ModalFooter>
            </Modal>
        </div>
    );
};

export default TournamentDetailPage;
