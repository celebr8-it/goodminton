/**
 * Match Detail Page
 * Comprehensive match management interface
 * Follows presentation/container component pattern
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatch } from '../hooks/useMatch';
import { useAuth } from '../lib/AuthContext';
import {
    ArrowLeft,
    Trophy,
    Play,
    CheckCircle,
    Loader2,
    Users,
    AlertCircle,
    Trash2
} from 'lucide-react';
import { SetScoreCard } from '../components/ScoreInput';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal, { ModalFooter } from '../components/Modal';
import { MATCH_STATUS } from '../lib/constants';

const MatchDetail = () => {
    const { matchId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        match,
        tournament,
        loading,
        error,
        saving,
        recordSetScore,
        completeMatch,
        startMatch,
        deleteSet,
        calculateWinner,
        validateSetScore
    } = useMatch(matchId);

    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [validationError, setValidationError] = useState(null);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error || !match) {
        return (
            <EmptyState
                icon={AlertCircle}
                title="Match not found"
                description={error || "This match doesn't exist"}
                action={{
                    label: 'Go Back',
                    onClick: () => navigate(-1)
                }}
            />
        );
    }

    const teamA = match.team_a;
    const teamB = match.team_b;
    const sets = match.match_sets || [];

    // Determine max sets based on scoring type
    const isSingleSet = tournament?.scoring_type === 'single_21' || tournament?.scoring_type === 'single_30';
    const maxSets = isSingleSet ? 1 : (tournament?.max_sets || 3);
    const winPoints = tournament?.scoring_type === 'single_30' ? 30 : (tournament?.win_points || 21);

    const winnerInfo = calculateWinner();
    const isCompleted = match.status === MATCH_STATUS.COMPLETED;
    const isStandalone = !match.tournament_id && match.group_id;

    /**
     * Handle set score save
     */
    const handleSetScoreSave = async (setNumber, scoreA, scoreB) => {
        try {
            setValidationError(null);

            // Validate score
            const validation = validateSetScore(scoreA, scoreB);
            if (!validation.isValid) {
                setValidationError(validation.errors.join('. '));
                return;
            }

            await recordSetScore(setNumber, scoreA, scoreB);
        } catch (err) {
            setValidationError(err.message);
        }
    };

    /**
     * Handle match completion
     */
    const handleCompleteMatch = async () => {
        if (!winnerInfo?.isComplete) {
            setValidationError('Match is not complete. Play required sets to determine winner.');
            return;
        }

        try {
            setValidationError(null);

            const winnerId = winnerInfo.winnerId === 'team_a'
                ? match.team_a_id
                : match.team_b_id;

            await completeMatch(winnerId);
            setShowCompleteModal(false);
        } catch (err) {
            setValidationError(err.message);
        }
    };

    /**
     * Handle match start
     */
    const handleStartMatch = async () => {
        try {
            setValidationError(null);
            await startMatch();
        } catch (err) {
            setValidationError(err.message);
        }
    };

    /**
     * Handle set deletion
     */
    const handleDeleteSet = async (setNumber) => {
        if (!confirm(`Delete Set ${setNumber}? This cannot be undone.`)) return;

        try {
            setValidationError(null);
            await deleteSet(setNumber);
        } catch (err) {
            setValidationError(err.message);
        }
    };

    /**
     * Render team info
     */
    const renderTeamInfo = (team, isWinner) => (
        <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                {isWinner && <Trophy size={20} style={{ color: 'var(--success-color)' }} />}
                <h3 style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: isWinner ? 'var(--success-color)' : 'var(--text-primary)'
                }}>
                    {team.name}
                </h3>
            </div>

            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                justifyContent: 'center'
            }}>
                {team.team_members?.map((tm) => (
                    <div key={tm.player_id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-secondary)',
                        fontSize: '14px'
                    }}>
                        <div className="avatar avatar-sm">
                            {tm.player?.full_name?.charAt(0) || tm.player?.email?.charAt(0)}
                        </div>
                        <span style={{ color: 'var(--text-muted)' }}>
                            {tm.player?.full_name || tm.player?.email}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );

    /**
     * Render set summary
     */
    const renderSetSummary = () => {
        if (sets.length === 0) return null;

        const sortedSets = [...sets].sort((a, b) => a.set_number - b.set_number);

        return (
            <div className="card" style={{ marginBottom: '24px' }}>
                <h3 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    marginBottom: '16px',
                    color: 'var(--text-primary)'
                }}>
                    Set Summary
                </h3>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    {sortedSets.map((set) => {
                        const setWinner = set.score_team_a > set.score_team_b ? 'A' : 'B';

                        return (
                            <div key={set.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px',
                                borderRadius: '8px',
                                backgroundColor: 'var(--bg-secondary)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: 'var(--text-muted)'
                                    }}>
                                        Set {set.set_number}
                                    </span>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <span style={{
                                            fontSize: '18px',
                                            fontWeight: 700,
                                            color: setWinner === 'A' ? 'var(--success-color)' : 'var(--text-primary)'
                                        }}>
                                            {set.score_team_a}
                                        </span>
                                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                                        <span style={{
                                            fontSize: '18px',
                                            fontWeight: 700,
                                            color: setWinner === 'B' ? 'var(--success-color)' : 'var(--text-primary)'
                                        }}>
                                            {set.score_team_b}
                                        </span>
                                    </div>
                                </div>

                                {!isCompleted && (
                                    <button
                                        onClick={() => handleDeleteSet(set.set_number)}
                                        disabled={saving}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            color: '#EF4444',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontSize: '13px'
                                        }}
                                    >
                                        <Trash2 size={14} />
                                        Delete
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {winnerInfo && (
                    <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: winnerInfo.isComplete
                            ? 'rgba(34, 197, 94, 0.1)'
                            : 'rgba(249, 115, 22, 0.1)',
                        border: `1px solid ${winnerInfo.isComplete ? '#22C55E' : '#F97316'}`
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: winnerInfo.isComplete ? '#22C55E' : '#F97316'
                        }}>
                            {winnerInfo.isComplete ? (
                                <>
                                    <CheckCircle size={16} />
                                    <span>
                                        {winnerInfo.winnerId === 'team_a' ? teamA.name : teamB.name} wins
                                        {' '}({winnerInfo.setsWon}-{winnerInfo.setsLost})
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Play size={16} />
                                    <span>
                                        Match in progress - Current: {winnerInfo.setsWon}-{winnerInfo.setsLost}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div>
            {/* Back Button */}
            <button
                onClick={() => navigate(isStandalone ? `/groups/${match.group_id}` : `/tournaments/${tournament?.id}`)}
                className="back-button"
            >
                <ArrowLeft size={18} />
                {isStandalone ? 'Back to Group' : 'Back to Tournament'}
            </button>

            {/* Match Header */}
            <div className="card section-gap">
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '24px',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <h1 style={{
                        fontSize: '24px',
                        fontWeight: 700,
                        color: 'var(--text-primary)'
                    }}>
                        {isStandalone ? 'Standalone Match' : 'Tournament Match'}
                    </h1>

                    <span className={
                        match.status === MATCH_STATUS.COMPLETED ? 'badge badge-success' :
                            match.status === MATCH_STATUS.IN_PROGRESS ? 'badge badge-primary' :
                                'badge badge-draft'
                    }>
                        {match.status === MATCH_STATUS.COMPLETED ? '✓ Completed' :
                            match.status === MATCH_STATUS.IN_PROGRESS ? '▶ In Progress' :
                                '○ Scheduled'}
                    </span>
                </div>

                {/* Teams Display */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    gap: '24px',
                    alignItems: 'center',
                    padding: '24px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg-secondary)'
                }}>
                    {renderTeamInfo(
                        teamA,
                        isCompleted && winnerInfo?.winnerId === 'team_a'
                    )}

                    <div style={{
                        fontSize: '32px',
                        fontWeight: 700,
                        color: 'var(--text-muted)'
                    }}>
                        VS
                    </div>

                    {renderTeamInfo(
                        teamB,
                        isCompleted && winnerInfo?.winnerId === 'team_b'
                    )}
                </div>

                {/* Match Info */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginTop: '20px',
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)'
                }}>
                    <div>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            Format
                        </p>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {tournament?.scoring_type === 'single_21' ? 'Single Set (21 points)' :
                                tournament?.scoring_type === 'single_30' ? 'Single Set (30 points)' :
                                    `Best of ${maxSets} to ${winPoints}`}
                        </p>
                    </div>

                    <div>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            Sets Played
                        </p>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {sets.length} / {maxSets}
                        </p>
                    </div>

                    {match.start_time && (
                        <div>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                Started
                            </p>
                            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {new Date(match.start_time).toLocaleString()}
                            </p>
                        </div>
                    )}

                    {match.end_time && (
                        <div>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                Completed
                            </p>
                            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {new Date(match.end_time).toLocaleString()}
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                {!isCompleted && (
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginTop: '20px',
                        flexWrap: 'wrap'
                    }}>
                        {match.status === MATCH_STATUS.SCHEDULED && (
                            <button
                                onClick={handleStartMatch}
                                disabled={saving}
                                className="btn-primary"
                            >
                                {saving ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
                                Start Match
                            </button>
                        )}

                        {winnerInfo?.isComplete && (
                            <button
                                onClick={() => setShowCompleteModal(true)}
                                disabled={saving}
                                className="btn-success"
                            >
                                <CheckCircle size={16} />
                                Complete Match
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Validation Error */}
            {validationError && (
                <div className="card" style={{
                    marginBottom: '24px',
                    padding: '16px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #EF4444'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: '#EF4444'
                    }}>
                        <AlertCircle size={20} />
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>
                            {validationError}
                        </span>
                    </div>
                </div>
            )}

            {/* Set Summary */}
            {renderSetSummary()}

            {/* Score Entry */}
            {!isCompleted && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <h2 className="section-title">
                        <Trophy size={20} />
                        Record Scores
                    </h2>

                    {Array.from({ length: maxSets }, (_, i) => i + 1).map((setNum) => {
                        const existingSet = sets.find(s => s.set_number === setNum);

                        return (
                            <SetScoreCard
                                key={setNum}
                                setNumber={setNum}
                                teamAName={teamA.name}
                                teamBName={teamB.name}
                                scoreTeamA={existingSet?.score_team_a || 0}
                                scoreTeamB={existingSet?.score_team_b || 0}
                                onSave={(scoreA, scoreB) => handleSetScoreSave(setNum, scoreA, scoreB)}
                                disabled={saving || isCompleted}
                                winPoints={winPoints}
                            />
                        );
                    })}
                </div>
            )}

            {/* Complete Match Modal */}
            <Modal
                isOpen={showCompleteModal}
                onClose={() => setShowCompleteModal(false)}
                title="Complete Match"
                description="Mark this match as complete? This action cannot be undone."
            >
                <div style={{ padding: '20px 0' }}>
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
                            textAlign: 'center'
                        }}>
                            Winner: {winnerInfo?.winnerId === 'team_a' ? teamA.name : teamB.name}
                        </p>
                        <p style={{
                            fontSize: '14px',
                            color: 'var(--text-muted)',
                            textAlign: 'center',
                            marginTop: '8px'
                        }}>
                            Sets: {winnerInfo?.setsWon} - {winnerInfo?.setsLost}
                        </p>
                    </div>
                </div>

                <ModalFooter>
                    <button
                        onClick={() => setShowCompleteModal(false)}
                        className="btn-secondary"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCompleteMatch}
                        className="btn-primary"
                        disabled={saving}
                    >
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                        {saving ? 'Completing...' : 'Confirm Complete'}
                    </button>
                </ModalFooter>
            </Modal>
        </div>
    );
};

export default MatchDetail;
