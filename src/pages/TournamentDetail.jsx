import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { TournamentService } from '../services/TournamentService';
import { MatchService } from '../services/MatchService';
import { GroupService } from '../services/GroupService';
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
    const [starting, setStarting] = useState(false);
    const [showAddTeamModal, setShowAddTeamModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [creatingTeam, setCreatingTeam] = useState(false);

    useEffect(() => {
        fetchTournamentData();
    }, [tournamentId]);

    const fetchTournamentData = async () => {
        try {
            // Fetch tournament details
            const tournamentData = await TournamentService.getTournamentById(tournamentId);
            setTournament(tournamentData);

            // Fetch teams with members
            const teamsData = await TournamentService.getTournamentTeams(tournamentId);
            setTeams(teamsData);

            // Fetch matches
            const matchesData = await MatchService.getMatchesByTournament(tournamentId);
            setMatches(matchesData);

            // Fetch group members
            if (tournamentData?.group_id) {
                const membersData = await GroupService.getGroupMembers(tournamentData.group_id);
                setMembers(membersData);
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
            await TournamentService.generateRandomTeams(tournamentId, members);
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
            const team = await TournamentService.createTeam(tournamentId, newTeamName);

            // Add selected members to the team
            for (const playerId of selectedMembers) {
                await TournamentService.addTeamMember(team.id, playerId);
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
        setStarting(true);

        try {
            const result = await TournamentService.startTournament(tournamentId);
            console.log(`Tournament started: ${result.matchCount} matches created`);
            fetchTournamentData();
        } catch (err) {
            console.error('Error starting tournament:', err);
            alert(err.message || 'Failed to start tournament. Please ensure you are the group owner and have the required permissions.');
        } finally {
            setStarting(false);
        }
    };

    const deleteTeam = async (teamId) => {
        if (!confirm('Delete this team?')) return;
        try {
            await TournamentService.deleteTeam(teamId);
            fetchTournamentData();
        } catch (err) {
            console.error('Error deleting team:', err);
            alert('Failed to delete team');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                <Loader2 className="animate-spin" size={36} style={{ color: 'var(--accent-primary)' }} />
            </div>
        );
    }

    if (!tournament) {
        return <div className="empty-state">Tournament not found</div>;
    }

    const assignedPlayerIds = teams.flatMap(t => t.team_members?.map(tm => tm.player_id) || []);
    const availableMembers = members.filter(m => !assignedPlayerIds.includes(m.id));

    return (
        <div>
            {/* Back Button */}
            <button onClick={() => navigate(`/groups/${tournament.group_id}`)} className="back-button">
                <ArrowLeft size={18} />
                Back to {tournament.group?.name}
            </button>

            {/* Tournament Header */}
            <div className="card section-gap">
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '20px' }}>
                    <div style={{
                        padding: '20px',
                        borderRadius: '16px',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)'
                    }}>
                        <Trophy size={32} style={{ color: 'var(--accent-primary)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                            {tournament.name}
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                            Scoring: {tournament.scoring_type?.replace('_', ' ')}
                        </p>
                    </div>
                    <span className={tournament.status === 'active' ? 'badge badge-success' : 'badge badge-primary'}>
                        {tournament.status === 'active' ? '🟢 Active' : '📝 Draft'}
                    </span>
                </div>
            </div>

            {/* Teams Section */}
            <div className="card section-gap">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <h2 className="section-title">
                        <Users size={20} />
                        Teams ({teams.length})
                    </h2>
                    {tournament.status === 'draft' && (
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button onClick={() => setShowAddTeamModal(true)} className="btn-secondary">
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
                    <div className="empty-state">
                        <Users size={48} className="empty-state-icon" style={{ color: 'var(--accent-primary)' }} />
                        <p style={{ marginBottom: '4px' }}>No teams yet</p>
                        <p style={{ fontSize: '13px' }}>Add teams manually or generate random teams</p>
                    </div>
                ) : (
                    <div className="grid-2">
                        {teams.map((team) => (
                            <div key={team.id} className="item-row" style={{ flexDirection: 'column', alignItems: 'stretch', position: 'relative' }}>
                                {tournament.status === 'draft' && (
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
                                <h3 style={{ fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
                                    {team.name}
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {team.team_members?.map((tm) => (
                                        <div key={tm.player_id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

                {tournament.status === 'draft' && teams.length >= 2 && (
                    <button
                        onClick={startTournament}
                        disabled={starting}
                        className="btn-primary"
                        style={{ width: '100%', marginTop: '20px' }}
                    >
                        {starting ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Starting...
                            </>
                        ) : (
                            <>
                                <Play size={18} />
                                Start Tournament ({teams.length} teams, {teams.length * (teams.length - 1) / 2} matches)
                            </>
                        )}
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
                            // Get team members from teams array
                            const teamAFull = teams.find(t => t.id === match.team_a_id);
                            const teamBFull = teams.find(t => t.id === match.team_b_id);
                            const teamAMembers = teamAFull?.team_members || [];
                            const teamBMembers = teamBFull?.team_members || [];
                            const isComplete = !!match.winner_team_id;
                            const isWinnerA = match.winner_team_id === match.team_a_id;

                            return (
                                <div
                                    key={match.id}
                                    className="item-row"
                                    style={{
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        padding: '16px',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => navigate(`/matches/${match.id}`)}
                                >
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <p style={{
                                            fontWeight: 600,
                                            color: isComplete && isWinnerA ? 'var(--success-color)' : 'var(--text-primary)',
                                            marginBottom: '8px'
                                        }}>
                                            {match.team_a?.name}
                                            {isComplete && isWinnerA && ' ✓'}
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                                            {teamAMembers.map((tm) => (
                                                <span key={tm.player_id} style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                    {tm.player?.full_name || tm.player?.email}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ padding: '0 16px', alignSelf: 'center' }}>
                                        <span className={isComplete ? 'badge badge-success' : 'badge badge-draft'}>VS</span>
                                    </div>
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <p style={{
                                            fontWeight: 600,
                                            color: isComplete && !isWinnerA ? 'var(--success-color)' : 'var(--text-primary)',
                                            marginBottom: '8px'
                                        }}>
                                            {match.team_b?.name}
                                            {isComplete && !isWinnerA && ' ✓'}
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                                            {teamBMembers.map((tm) => (
                                                <span key={tm.player_id} style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                    {tm.player?.full_name || tm.player?.email}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Add Team Modal */}
            {showAddTeamModal && (
                <>
                    <div className="modal-backdrop" onClick={() => setShowAddTeamModal(false)} />
                    <div className="modal-container">
                        <div className="card modal-content" style={{ maxHeight: '80vh', overflow: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Create Team</h2>
                                <button
                                    onClick={() => setShowAddTeamModal(false)}
                                    style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateTeam}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                                        Team Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Team Alphas"
                                        className="input-field"
                                        value={newTeamName}
                                        onChange={(e) => setNewTeamName(e.target.value)}
                                    />
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
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
                                            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '14px' }}>
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
                                                            backgroundColor: selectedMembers.includes(member.id) ? 'rgba(79, 70, 229, 0.1)' : 'transparent'
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

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                                    <button type="button" onClick={() => setShowAddTeamModal(false)} className="btn-secondary">
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
