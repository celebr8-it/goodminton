/**
 * Tournament Detail Page
 * Mobile-first tournament hub: what to play next, the league table,
 * the playoff bracket and team setup.
 */

import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTournament } from '../hooks/useTournament';
import { TournamentService } from '../services/TournamentService';
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
    AlertTriangle,
    ListOrdered,
    Swords,
    GitBranch,
    Lock,
    Medal
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal, { ModalFooter } from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import MatchCard from '../components/MatchCard';
import TeamBuilder from '../components/TeamBuilder';
import { TOURNAMENT_STATUS } from '../lib/constants';
import { formatShortLabel } from '../lib/scoringFormat';
import { autoTeamName, firstName, playerDisplayName, teamPlayers } from '../lib/names';

const ROUND_PLURAL = { 2: 'Final', 4: 'Semi-finals', 8: 'Quarter-finals' };
const ROUND_SHORT = { 2: 'F', 4: 'SF', 8: 'QF' };
const PLAYOFF_CHOICE_LABEL = { 2: 'Final', 4: 'Semis', 8: 'Quarters', 16: 'Last 16' };

const TournamentDetailPage = () => {
    const { tournamentId } = useParams();
    const navigate = useNavigate();

    const {
        tournament,
        teams,
        matches,
        standings,
        phase,
        loading,
        actionLoading,
        startTournament,
        completeTournament,
        startPlayoffs,
        refetch
    } = useTournament(tournamentId);

    const [tab, setTab] = useState(null);
    const [members, setMembers] = useState([]);
    const [showAddTeamModal, setShowAddTeamModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [creatingTeam, setCreatingTeam] = useState(false);
    const [lastCreatedTeam, setLastCreatedTeam] = useState(null);
    const [generating, setGenerating] = useState(false);
    // null = auto: open while there are no teams yet
    const [showBuilder, setShowBuilder] = useState(null);
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [showDeleteTournamentModal, setShowDeleteTournamentModal] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showAddMatchModal, setShowAddMatchModal] = useState(false);
    const [selectedTeamA, setSelectedTeamA] = useState('');
    const [selectedTeamB, setSelectedTeamB] = useState('');
    const [creatingMatch, setCreatingMatch] = useState(false);
    const [showPlayoffModal, setShowPlayoffModal] = useState(false);
    const [playoffSize, setPlayoffSize] = useState(null);
    const [actionError, setActionError] = useState(null);

    // Load group members
    React.useEffect(() => {
        if (!tournament?.group_id) return;
        supabase
            .from('group_members')
            .select('players(id, full_name, email, avatar_url)')
            .eq('group_id', tournament.group_id)
            .then(({ data, error }) => {
                if (error) console.error('Error loading members:', error);
                setMembers(data?.map(m => m.players).filter(Boolean) || []);
            });
    }, [tournament?.group_id]);

    const teamsById = useMemo(() => new Map(teams.map(t => [t.id, t])), [teams]);

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

    const isDraft = tournament.status === TOURNAMENT_STATUS.DRAFT;
    const builderOpen = (showBuilder ?? teams.length === 0) && members.length >= 2;
    const isActive = tournament.status === TOURNAMENT_STATUS.ACTIVE;
    const isCompleted = tournament.status === TOURNAMENT_STATUS.COMPLETED;

    const playoffOptions = TournamentService.getPlayoffOptions(teams.length);
    const defaultPlayoffSize = TournamentService.getDefaultPlayoffSize(teams.length);
    const canStartPlayoffs = isActive && !phase.hasPlayoffs && phase.leagueComplete && playoffOptions.length > 0;

    const pendingMatches = [
        ...phase.playoffMatches.filter(m => !m.winner_team_id).sort((a, b) => b.round_size - a.round_size || a.bracket_slot - b.bracket_slot),
        ...phase.leagueMatches.filter(m => !m.winner_team_id)
    ];
    const playedMatches = matches
        .filter(m => m.winner_team_id)
        .sort((a, b) => new Date(b.end_time || b.created_at) - new Date(a.end_time || a.created_at));
    const nextUp = pendingMatches[0];

    const leagueNumber = new Map(phase.leagueMatches.map((m, i) => [m.id, i + 1]));
    const matchLabel = (m) => m.stage === 'playoff'
        ? `${TournamentService.getRoundLabel(m.round_size)}${m.round_size > 2 ? ` ${m.bracket_slot + 1}` : ''}`
        : `League · Match ${leagueNumber.get(m.id)}`;

    const championTeam = phase.championTeamId
        ? teamsById.get(phase.championTeamId)
        : isCompleted ? standings[0]?.team : null;
    const final = phase.playoffMatches.find(m => m.round_size === 2);
    const runnerUpTeam = final?.winner_team_id
        ? teamsById.get(final.winner_team_id === final.team_a_id ? final.team_b_id : final.team_a_id)
        : isCompleted && !phase.hasPlayoffs ? standings[1]?.team : null;

    const tabs = [
        !isDraft && { id: 'matches', label: 'Matches', icon: Swords, count: pendingMatches.length || null },
        !isDraft && { id: 'table', label: 'Table', icon: ListOrdered },
        phase.hasPlayoffs && { id: 'playoffs', label: 'Playoffs', icon: GitBranch },
        { id: 'teams', label: 'Teams', icon: Users, count: teams.length }
    ].filter(Boolean);
    const defaultTab = isDraft ? 'teams' : phase.hasPlayoffs ? 'playoffs' : 'matches';
    const activeTab = tabs.some(t => t.id === tab) ? tab : defaultTab;

    // ---------- actions ----------

    const runWithError = async (fn) => {
        setActionError(null);
        try {
            await fn();
        } catch (err) {
            setActionError(err.message);
        }
    };

    const handleCreatePairs = (pairs, options) => runWithError(async () => {
        setGenerating(true);
        try {
            await TournamentService.createTeamsFromPairs(tournamentId, pairs, options);
            await refetch();
            setShowBuilder(false);
        } finally {
            setGenerating(false);
        }
    });

    const openAddTeam = () => {
        setNewTeamName('');
        setSelectedMembers([]);
        setLastCreatedTeam(null);
        setShowAddTeamModal(true);
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        if (selectedMembers.length === 0) return;

        const players = selectedMembers.map(id => members.find(m => m.id === id));
        const name = newTeamName.trim() || autoTeamName(players);

        setCreatingTeam(true);
        try {
            const team = await TournamentService.createTeam(tournamentId, name);
            for (const playerId of selectedMembers) {
                await TournamentService.addTeamMember(team.id, playerId);
            }
            // Keep the sheet open so the next pair can be added straight away
            setLastCreatedTeam(name);
            setNewTeamName('');
            setSelectedMembers([]);
            await refetch();
        } catch (err) {
            console.error('Error creating team:', err);
            alert(err.message || 'Failed to create team');
        } finally {
            setCreatingTeam(false);
        }
    };

    const deleteTeam = async (teamId) => {
        if (!confirm('Delete this team?')) return;
        runWithError(async () => {
            await TournamentService.deleteTeam(teamId);
            await refetch();
        });
    };

    const handleStartTournament = () => runWithError(async () => {
        await startTournament();
        setTab('matches');
    });

    const handleFinishLeague = () => runWithError(async () => {
        await completeTournament();
        setShowFinishModal(false);
    });

    const handleStartPlayoffs = () => runWithError(async () => {
        await startPlayoffs(playoffSize);
        setShowPlayoffModal(false);
        setTab('playoffs');
    });

    const handleDeleteTournament = async () => {
        setDeleting(true);
        try {
            await TournamentService.deleteTournament(tournamentId);
            setShowDeleteTournamentModal(false);
            navigate(`/groups/${tournament.group_id}`);
        } catch (err) {
            alert(err.message);
        } finally {
            setDeleting(false);
        }
    };

    const handleCreateCustomMatch = async () => {
        if (!selectedTeamA || !selectedTeamB || selectedTeamA === selectedTeamB) return;
        setCreatingMatch(true);
        try {
            await TournamentService.createCustomMatch(tournamentId, selectedTeamA, selectedTeamB);
            setShowAddMatchModal(false);
            setSelectedTeamA('');
            setSelectedTeamB('');
            await refetch();
        } catch (err) {
            alert(err.message);
        } finally {
            setCreatingMatch(false);
        }
    };

    const toggleMemberSelection = (playerId) => {
        setSelectedMembers(prev =>
            prev.includes(playerId)
                ? prev.filter(id => id !== playerId)
                : prev.length >= 2 ? prev : [...prev, playerId]
        );
    };

    const openMatch = (m) => navigate(`/matches/${m.id}`);

    // ---------- render helpers ----------

    const renderPhaseCard = () => {
        if (isDraft) {
            const matchCount = teams.length * (teams.length - 1) / 2;
            return (
                <div className="card section-gap" style={{ padding: '16px' }}>
                    {teams.length < 2 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>
                            Add at least 2 teams below to start the league.
                        </p>
                    ) : (
                        <button
                            onClick={handleStartTournament}
                            disabled={actionLoading}
                            className="btn-primary btn-lg btn-block"
                        >
                            {actionLoading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                            Start league · {teams.length} teams, {matchCount} matches
                        </button>
                    )}
                </div>
            );
        }

        if (isCompleted && championTeam) {
            return (
                <div className="card section-gap" style={{
                    padding: '20px',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, color-mix(in srgb, #F59E0B 18%, var(--bg-surface)), var(--bg-surface))'
                }}>
                    <Trophy size={40} style={{ color: '#F59E0B', margin: '0 auto 8px' }} />
                    <div className="eyebrow">Champions</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                        {championTeam.name}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {teamPlayers(championTeam).map(playerDisplayName).join(' & ')}
                    </div>
                    {runnerUpTeam && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                            <Medal size={14} /> Runner-up: <strong style={{ color: 'var(--text-primary)' }}>{runnerUpTeam.name}</strong>
                        </div>
                    )}
                </div>
            );
        }

        if (!isActive) return null;

        return (
            <div className="section-gap list-gap">
                {nextUp && (
                    <MatchCard
                        match={nextUp}
                        teamsById={teamsById}
                        seeds={phase.seeds}
                        label={`Next up · ${matchLabel(nextUp)}`}
                        highlight
                        onClick={() => openMatch(nextUp)}
                        action={<span className="btn-primary btn-block">Enter score</span>}
                    />
                )}

                {!phase.hasPlayoffs && (
                    canStartPlayoffs ? (
                        <div className="card" style={{ padding: '16px' }}>
                            <div className="notice notice-success" style={{ marginBottom: '12px' }}>
                                <CheckCircle size={18} style={{ flexShrink: 0 }} />
                                <span>League complete! Top teams can now go into the playoffs.</span>
                            </div>
                            <button
                                onClick={() => { setPlayoffSize(defaultPlayoffSize); setShowPlayoffModal(true); }}
                                className="btn-primary btn-lg btn-block"
                            >
                                <GitBranch size={18} />
                                Start playoffs
                            </button>
                            <div style={{ textAlign: 'center', marginTop: '6px' }}>
                                <button className="btn-link" onClick={() => setShowFinishModal(true)}>
                                    Finish without playoffs
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            className="btn-secondary btn-block"
                            disabled
                            style={{ opacity: 0.65, cursor: 'not-allowed', whiteSpace: 'normal' }}
                        >
                            <Lock size={16} />
                            Playoffs unlock after {phase.leaguePending} more league {phase.leaguePending === 1 ? 'match' : 'matches'}
                        </button>
                    )
                )}
            </div>
        );
    };

    const renderMatchesTab = () => (
        <div className="list-gap" style={{ gap: '20px' }}>
            {pendingMatches.length > 0 && (
                <div>
                    <div className="eyebrow" style={{ marginBottom: '8px' }}>Up next · {pendingMatches.length}</div>
                    <div className="list-gap">
                        {pendingMatches.map((m, i) => (
                            <MatchCard
                                key={m.id}
                                match={m}
                                teamsById={teamsById}
                                seeds={m.stage === 'playoff' ? phase.seeds : undefined}
                                label={matchLabel(m)}
                                highlight={i === 0}
                                onClick={() => openMatch(m)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {isActive && !phase.hasPlayoffs && teams.length >= 2 && (
                <button
                    onClick={() => { setSelectedTeamA(''); setSelectedTeamB(''); setShowAddMatchModal(true); }}
                    className="btn-secondary btn-block"
                >
                    <Plus size={16} />
                    Add extra league match
                </button>
            )}

            {playedMatches.length > 0 && (
                <div>
                    <div className="eyebrow" style={{ marginBottom: '8px' }}>Played · tap to edit</div>
                    <div className="list-gap">
                        {playedMatches.map(m => (
                            <MatchCard
                                key={m.id}
                                match={m}
                                teamsById={teamsById}
                                seeds={m.stage === 'playoff' ? phase.seeds : undefined}
                                label={matchLabel(m)}
                                onClick={() => openMatch(m)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {matches.length === 0 && (
                <EmptyState icon={Swords} title="No matches yet" description="Matches appear once the league starts" />
            )}
        </div>
    );

    const renderTableTab = () => {
        if (standings.length === 0) {
            return <EmptyState icon={ListOrdered} title="No standings yet" description="Play some matches first" />;
        }
        const showCutoff = !phase.hasPlayoffs && isActive && defaultPlayoffSize < teams.length;

        return (
            <div className="card" style={{ padding: '12px' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="standings">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Team</th>
                                <th>P</th>
                                <th>W</th>
                                <th>L</th>
                                <th className="hide-mobile">Sets</th>
                                <th>+/-</th>
                                <th>Pts</th>
                            </tr>
                        </thead>
                        <tbody>
                            {standings.map((s, index) => {
                                const fullTeam = teamsById.get(s.team.id);
                                const qualified = phase.seeds.has(s.team.id);
                                const eliminated = phase.hasPlayoffs && !qualified;
                                const diff = s.pointsWon - s.pointsLost;
                                const classes = [
                                    eliminated && 'eliminated',
                                    showCutoff && index === defaultPlayoffSize - 1 && 'cutoff'
                                ].filter(Boolean).join(' ');

                                return (
                                    <tr key={s.team.id} className={classes}>
                                        <td style={{ fontWeight: 700 }}>{index + 1}</td>
                                        <td>
                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.team.name}</span>
                                                {s.team.id === phase.championTeamId && <Trophy size={14} style={{ color: '#F59E0B', flexShrink: 0 }} />}
                                                {qualified && s.team.id !== phase.championTeamId && (
                                                    <span className="badge badge-success" style={{ padding: '1px 6px', fontSize: '10px' }}>Q</span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                {teamPlayers(fullTeam).map(firstName).join(' & ')}
                                            </div>
                                        </td>
                                        <td>{s.matchesPlayed}</td>
                                        <td style={{ color: 'var(--success-color)', fontWeight: 600 }}>{s.matchesWon}</td>
                                        <td>{s.matchesLost}</td>
                                        <td className="hide-mobile">{s.setsWon}-{s.setsLost}</td>
                                        <td style={{ color: diff > 0 ? 'var(--success-color)' : diff < 0 ? 'var(--danger-color)' : undefined }}>
                                            {diff > 0 ? `+${diff}` : diff}
                                        </td>
                                        <td style={{ fontWeight: 800, color: 'var(--accent-primary)', fontSize: '16px' }}>{s.points}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>
                    Win = 2 pts. Ties broken by wins, set difference, then point difference.
                    {showCutoff && ` Top ${defaultPlayoffSize} above the dashed line make the playoffs.`}
                    {phase.hasPlayoffs && ' League only, playoff results are in the Playoffs tab.'}
                </p>
            </div>
        );
    };

    const renderPlayoffsTab = () => {
        const firstRound = Math.max(...phase.playoffMatches.map(m => m.round_size));
        const rounds = [];
        for (let size = firstRound; size >= 2; size /= 2) rounds.push(size);

        return (
            <div className="list-gap" style={{ gap: '20px' }}>
                {rounds.map(size => (
                    <div key={size}>
                        <div className="eyebrow" style={{ marginBottom: '8px' }}>{ROUND_PLURAL[size] || `Round of ${size}`}</div>
                        <div className="list-gap">
                            {Array.from({ length: size / 2 }, (_, slot) => {
                                const m = phase.playoffMatches.find(pm => pm.round_size === size && pm.bracket_slot === slot);
                                if (m) {
                                    return (
                                        <MatchCard
                                            key={m.id}
                                            match={m}
                                            teamsById={teamsById}
                                            seeds={phase.seeds}
                                            label={size > 2 ? `${ROUND_SHORT[size] || 'R'}${slot + 1}` : 'Final'}
                                            highlight={m.id === nextUp?.id}
                                            onClick={() => openMatch(m)}
                                        />
                                    );
                                }
                                const feeder = ROUND_SHORT[size * 2] || 'R';
                                return (
                                    <div key={`tbd-${size}-${slot}`} className="match-card match-card-tbd">
                                        <div className="eyebrow" style={{ marginBottom: '6px' }}>
                                            {size > 2 ? `${ROUND_SHORT[size] || 'R'}${slot + 1}` : 'Final'}
                                        </div>
                                        <div className="match-team-players" style={{ fontSize: '14px', padding: '4px 0' }}>
                                            Winner {feeder}{slot * 2 + 1}
                                        </div>
                                        <div className="match-team-players" style={{ fontSize: '14px', padding: '4px 0' }}>
                                            Winner {feeder}{slot * 2 + 2}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Numbers are league seeds. Winners move on automatically when a score is saved.
                </p>
            </div>
        );
    };

    const renderTeamsTab = () => (
        <div>
            {isDraft && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    <button onClick={openAddTeam} className="btn-primary">
                        <Plus size={16} />
                        Add team
                    </button>
                    <button
                        onClick={() => setShowBuilder(open => !(open ?? teams.length === 0))}
                        disabled={members.length < 2}
                        className={builderOpen ? 'btn-secondary choice-active' : 'btn-secondary'}
                    >
                        <Shuffle size={16} />
                        Team builder
                    </button>
                </div>
            )}

            {isDraft && builderOpen && (
                <TeamBuilder
                    groupId={tournament.group_id}
                    members={members}
                    teams={teams}
                    busy={generating}
                    onCreate={handleCreatePairs}
                />
            )}

            {teams.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="No teams yet"
                    description="Use the team builder, or add teams by hand"
                />
            ) : (
                <div className="grid-2" style={{ gap: '10px' }}>
                    {teams.map((team) => (
                        <div key={team.id} className="item-row" style={{ justifyContent: 'space-between' }}>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{team.name}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                    {teamPlayers(team).map(playerDisplayName).join(' & ')}
                                </div>
                            </div>
                            {isDraft && (
                                <button
                                    onClick={() => deleteTeam(team.id)}
                                    className="btn-danger-ghost"
                                    aria-label={`Delete ${team.name}`}
                                    style={{ padding: '8px' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // ---------- page ----------

    const assignedPlayerIds = new Set(teams.flatMap(t => t.team_members?.map(tm => tm.player_id) || []));
    const availableMembers = members.filter(m => !assignedPlayerIds.has(m.id));
    const selectedPlayers = selectedMembers.map(id => members.find(m => m.id === id)).filter(Boolean);
    const playoffPairings = playoffSize ? TournamentService.buildPlayoffPairings(standings, playoffSize) : [];
    const playoffEliminated = playoffSize ? standings.slice(playoffSize) : [];

    const statusBadge = isCompleted
        ? <span className="badge badge-success">✓ Completed</span>
        : isActive
            ? <span className="badge badge-primary">{phase.hasPlayoffs ? '▶ Playoffs' : '▶ League'}</span>
            : <span className="badge badge-draft">○ Draft</span>;

    return (
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            <button onClick={() => navigate(`/groups/${tournament.group_id}`)} className="back-button">
                <ArrowLeft size={18} />
                {tournament.group?.name || 'Back'}
            </button>

            {/* Header */}
            <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h1 style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1.2, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                            {tournament.name}
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                            {formatShortLabel(tournament)} · {teams.length} teams
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        {statusBadge}
                        {isDraft && (
                            <button
                                onClick={() => setShowDeleteTournamentModal(true)}
                                className="btn-danger-ghost"
                                style={{ padding: '8px' }}
                                aria-label="Delete tournament"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {isActive && (
                    <div style={{ marginTop: '14px' }}>
                        {phase.hasPlayoffs ? (
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                                League done · now playing the {TournamentService.getRoundLabel(phase.currentRound).toLowerCase()}
                                {phase.currentRound > 2 ? 's' : ''}
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                                    <span>League progress</span>
                                    <span>{phase.leagueDone} / {phase.leagueTotal}</span>
                                </div>
                                <div className="progress-track">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${phase.leagueTotal ? (phase.leagueDone / phase.leagueTotal) * 100 : 0}%` }}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {actionError && (
                <div className="notice notice-error" style={{ marginBottom: '16px' }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <span>{actionError}</span>
                </div>
            )}

            {renderPhaseCard()}

            {/* Tabs */}
            {tabs.length > 1 && (
                <div className="tabs" role="tablist">
                    {tabs.map(t => {
                        const Icon = t.icon;
                        return (
                            <button
                                key={t.id}
                                role="tab"
                                aria-selected={activeTab === t.id}
                                className={`tab ${activeTab === t.id ? 'tab-active' : ''}`}
                                onClick={() => setTab(t.id)}
                            >
                                <Icon size={16} />
                                {t.label}
                                {t.count ? <span className="tab-count">{t.count}</span> : null}
                            </button>
                        );
                    })}
                </div>
            )}

            {activeTab === 'matches' && renderMatchesTab()}
            {activeTab === 'table' && renderTableTab()}
            {activeTab === 'playoffs' && renderPlayoffsTab()}
            {activeTab === 'teams' && renderTeamsTab()}

            {/* Add Team Modal */}
            <Modal
                isOpen={showAddTeamModal}
                onClose={() => setShowAddTeamModal(false)}
                title="Add team"
                description="Tap two players. The name is optional."
            >
                <form onSubmit={handleCreateTeam}>
                    {lastCreatedTeam && (
                        <div className="notice notice-success" style={{ marginBottom: '16px' }}>
                            <CheckCircle size={18} style={{ flexShrink: 0 }} />
                            <span>{lastCreatedTeam} added. Pick the next pair or tap Done.</span>
                        </div>
                    )}

                    <div style={{ marginBottom: '20px' }}>
                        <div className="eyebrow" style={{ marginBottom: '8px' }}>
                            Players ({selectedMembers.length}/2)
                        </div>
                        {availableMembers.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '14px' }}>
                                Everyone is already in a team
                            </p>
                        ) : (
                            <div className="chip-grid" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                                {availableMembers.map((member) => {
                                    const selected = selectedMembers.includes(member.id);
                                    return (
                                        <button
                                            key={member.id}
                                            type="button"
                                            className={`chip ${selected ? 'chip-active' : ''}`}
                                            onClick={() => toggleMemberSelection(member.id)}
                                            disabled={!selected && selectedMembers.length >= 2}
                                        >
                                            {selected && <CheckCircle size={16} />}
                                            {playerDisplayName(member)}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="eyebrow" htmlFor="team-name" style={{ display: 'block', marginBottom: '8px' }}>
                            Team name (optional)
                        </label>
                        <input
                            id="team-name"
                            type="text"
                            placeholder={autoTeamName(selectedPlayers) || 'Uses player names if left empty'}
                            className="input-field"
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            maxLength={40}
                        />
                    </div>

                    <ModalFooter>
                        <button type="button" onClick={() => setShowAddTeamModal(false)} className="btn-secondary">
                            Done
                        </button>
                        <button
                            type="submit"
                            disabled={creatingTeam || selectedMembers.length === 0}
                            className="btn-primary"
                        >
                            {creatingTeam ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                            {creatingTeam ? 'Adding…' : 'Add team'}
                        </button>
                    </ModalFooter>
                </form>
            </Modal>

            {/* Start Playoffs Modal */}
            <Modal
                isOpen={showPlayoffModal}
                onClose={() => setShowPlayoffModal(false)}
                title="Start playoffs"
                description="Top teams from the league table go into a knockout bracket. #1 plays the lowest seed."
            >
                <div className="eyebrow" style={{ margin: '16px 0 8px' }}>How many teams qualify?</div>
                <div className="choice-grid">
                    {playoffOptions.map(size => (
                        <button
                            key={size}
                            type="button"
                            className={`choice ${playoffSize === size ? 'choice-active' : ''}`}
                            onClick={() => setPlayoffSize(size)}
                        >
                            Top {size}
                            <small>{PLAYOFF_CHOICE_LABEL[size]}</small>
                        </button>
                    ))}
                </div>

                <div className="eyebrow" style={{ margin: '20px 0 8px' }}>
                    {TournamentService.getRoundLabel(playoffSize || 2)}{playoffSize > 2 ? 's' : ''}
                </div>
                <div className="list-gap" style={{ gap: '8px' }}>
                    {playoffPairings.map(p => (
                        <div key={p.slot} className="item-row" style={{ padding: '10px 12px', gap: '8px', fontSize: '14px' }}>
                            <span className="seed">{p.seedA}</span>
                            <strong style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.teamA?.name}</strong>
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 700 }}>vs</span>
                            <strong style={{ flex: 1, minWidth: 0, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.teamB?.name}</strong>
                            <span className="seed" style={{ marginRight: 0, marginLeft: '4px' }}>{p.seedB}</span>
                        </div>
                    ))}
                </div>

                {playoffEliminated.length > 0 && (
                    <div className="notice notice-warning" style={{ marginTop: '16px' }}>
                        <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                        <span>
                            Eliminated: {playoffEliminated.map(s => s.team.name).join(', ')}
                        </span>
                    </div>
                )}

                <ModalFooter>
                    <button onClick={() => setShowPlayoffModal(false)} className="btn-secondary" disabled={actionLoading}>
                        Cancel
                    </button>
                    <button onClick={handleStartPlayoffs} className="btn-primary" disabled={actionLoading || !playoffSize}>
                        {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <GitBranch size={16} />}
                        Start playoffs
                    </button>
                </ModalFooter>
            </Modal>

            {/* Finish Without Playoffs Modal */}
            <Modal
                isOpen={showFinishModal}
                onClose={() => setShowFinishModal(false)}
                title="Finish without playoffs"
                description="The league leader becomes the champion."
            >
                {standings[0] && (
                    <div className="notice notice-success" style={{ marginTop: '16px' }}>
                        <Trophy size={18} style={{ flexShrink: 0 }} />
                        <span>
                            <strong>{standings[0].team.name}</strong>, {standings[0].matchesWon} wins, {standings[0].points} pts
                        </span>
                    </div>
                )}
                <ModalFooter>
                    <button onClick={() => setShowFinishModal(false)} className="btn-secondary" disabled={actionLoading}>
                        Cancel
                    </button>
                    <button onClick={handleFinishLeague} className="btn-primary" disabled={actionLoading}>
                        {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                        Finish tournament
                    </button>
                </ModalFooter>
            </Modal>

            {/* Delete Tournament Modal */}
            <Modal
                isOpen={showDeleteTournamentModal}
                onClose={() => setShowDeleteTournamentModal(false)}
                title="Delete tournament"
                description="All teams and matches in this tournament will be permanently deleted."
            >
                <div className="notice notice-error" style={{ marginTop: '16px' }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <span>This can't be undone.</span>
                </div>
                <ModalFooter>
                    <button onClick={() => setShowDeleteTournamentModal(false)} className="btn-secondary" disabled={deleting}>
                        Cancel
                    </button>
                    <button
                        onClick={handleDeleteTournament}
                        disabled={deleting}
                        className="btn-primary"
                        style={{ background: 'var(--danger-color)', boxShadow: 'none' }}
                    >
                        {deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                        {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                </ModalFooter>
            </Modal>

            {/* Add Custom Match Modal */}
            <Modal
                isOpen={showAddMatchModal}
                onClose={() => setShowAddMatchModal(false)}
                title="Add league match"
                description="Counts towards the league table."
            >
                <div className="list-gap" style={{ gap: '12px', marginTop: '16px' }}>
                    <select
                        value={selectedTeamA}
                        onChange={(e) => setSelectedTeamA(e.target.value)}
                        className="select-field"
                        aria-label="Team A"
                    >
                        <option value="">Select team…</option>
                        {teams.map(team => (
                            <option key={team.id} value={team.id} disabled={team.id === selectedTeamB}>
                                {team.name}
                            </option>
                        ))}
                    </select>
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: '13px' }}>VS</div>
                    <select
                        value={selectedTeamB}
                        onChange={(e) => setSelectedTeamB(e.target.value)}
                        className="select-field"
                        aria-label="Team B"
                    >
                        <option value="">Select team…</option>
                        {teams.map(team => (
                            <option key={team.id} value={team.id} disabled={team.id === selectedTeamA}>
                                {team.name}
                            </option>
                        ))}
                    </select>
                </div>
                <ModalFooter>
                    <button onClick={() => setShowAddMatchModal(false)} className="btn-secondary" disabled={creatingMatch}>
                        Cancel
                    </button>
                    <button
                        onClick={handleCreateCustomMatch}
                        className="btn-primary"
                        disabled={creatingMatch || !selectedTeamA || !selectedTeamB}
                    >
                        {creatingMatch ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                        Create match
                    </button>
                </ModalFooter>
            </Modal>
        </div>
    );
};

export default TournamentDetailPage;
