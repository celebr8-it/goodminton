/**
 * Match Detail Page
 * Quick result entry built for courtside phones:
 * type the final score of each set, tap save, done. The match completes
 * itself once the sets decide a winner, and results can be edited later.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatch } from '../hooks/useMatch';
import {
    ArrowLeft,
    Trophy,
    CheckCircle,
    Loader2,
    AlertCircle,
    AlertTriangle,
    Pencil,
    ChevronRight,
    Save,
    X
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { MatchService } from '../services/MatchService';
import { TournamentService, MATCH_STAGE } from '../services/TournamentService';
import { firstName, teamPlayers } from '../lib/names';

const toNumber = (value) => (value === '' ? null : parseInt(value, 10));

const emptySets = (count) => Array.from({ length: count }, () => ({ a: '', b: '' }));

const MatchDetail = () => {
    const { matchId } = useParams();
    const navigate = useNavigate();
    const { match, tournament, nextMatch, loading, error, saving, saveResult } = useMatch(matchId);

    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState([]);
    const [saveError, setSaveError] = useState(null);
    const [savedNotice, setSavedNotice] = useState(null);
    const inputRefs = useRef({});

    const format = useMemo(() => MatchService.getMatchFormat(tournament), [tournament]);

    // Moving to the next match reuses this component, so reset messages
    useEffect(() => {
        setSaveError(null);
        setSavedNotice(null);
    }, [matchId]);

    // Load saved sets into the form whenever the match changes
    useEffect(() => {
        if (!match) return;
        const saved = [...(match.match_sets || [])].sort((a, b) => a.set_number - b.set_number);
        const sets = emptySets(format.maxSets);
        saved.slice(0, format.maxSets).forEach((s, i) => {
            sets[i] = { a: String(s.score_team_a), b: String(s.score_team_b) };
        });
        setDraft(sets);
        setEditing(!match.winner_team_id);
    }, [match, format.maxSets]);

    /**
     * Work out how many set rows to show (set 3 only appears at 1-1),
     * per-set validation, and what saving would do.
     */
    const entry = useMemo(() => {
        const setsToWin = Math.ceil(format.maxSets / 2);
        const rows = [];
        let winsA = 0;
        let winsB = 0;

        for (let i = 0; i < format.maxSets; i++) {
            const raw = draft[i] || { a: '', b: '' };
            const a = toNumber(raw.a);
            const b = toNumber(raw.b);
            const filled = a !== null && b !== null;
            const empty = a === null && b === null;
            const validation = filled ? MatchService.validateSetScore(a, b, tournament) : null;
            rows.push({ index: i, a, b, filled, empty, validation });

            if (!filled || !validation.isValid) break;
            if (a > b) winsA++;
            else winsB++;
            if (winsA >= setsToWin || winsB >= setsToWin) break;
        }

        const blocking = rows.some((r) => (!r.filled && !r.empty) || (r.filled && !r.validation.isValid));
        const sets = rows.filter((r) => r.filled).map((r) => ({ a: r.a, b: r.b }));
        const winner = winsA >= setsToWin ? 'a' : winsB >= setsToWin ? 'b' : null;

        return { rows, sets, winner, winsA, winsB, blocking };
    }, [draft, format.maxSets, tournament]);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error || !match) {
        return (
            <EmptyState
                icon={AlertCircle}
                title="Match not found"
                description={error || "This match doesn't exist"}
                action={{ label: 'Go Back', onClick: () => navigate(-1) }}
            />
        );
    }

    const teamA = match.team_a;
    const teamB = match.team_b;
    const isStandalone = !match.tournament_id && match.group_id;
    const isCompleted = !!match.winner_team_id;
    const backPath = isStandalone ? `/groups/${match.group_id}` : `/tournaments/${match.tournament_id}`;
    const stageLabel = isStandalone
        ? 'Friendly match'
        : match.stage === MATCH_STAGE.PLAYOFF
            ? TournamentService.getRoundLabel(match.round_size)
            : 'League match';
    const formatLabel = format.maxSets === 1
        ? `1 set to ${format.winPoints}`
        : `Best of ${format.maxSets} · ${format.winPoints} pts`;
    const teamName = (side) => (side === 'a' ? teamA.name : teamB.name);
    const savedSets = [...(match.match_sets || [])].sort((a, b) => a.set_number - b.set_number);

    // ---------- input handling ----------

    const focusField = (setIndex, side) => {
        setTimeout(() => {
            const el = inputRefs.current[`${setIndex}${side}`];
            if (el) {
                el.focus();
                el.select();
            } else {
                document.activeElement?.blur();
            }
        }, 0);
    };

    const updateField = (setIndex, side, value) => {
        setSaveError(null);
        setSavedNotice(null);
        setDraft((prev) => prev.map((s, i) => (i === setIndex ? { ...s, [side]: value } : s)));
    };

    /**
     * Move to the next box. If the opponent's box is empty and the typed score
     * can only be the loser's (e.g. 15), pre-fill the winner's score (21).
     */
    const advance = (setIndex, side, value) => {
        const other = side === 'a' ? 'b' : 'a';
        const current = draft[setIndex] || { a: '', b: '' };
        if (current[other] === '') {
            const suggestion = MatchService.suggestOpponentScore(toNumber(value), tournament);
            if (suggestion !== null) updateField(setIndex, other, String(suggestion));
        }
        if (side === 'a') focusField(setIndex, 'b');
        else focusField(setIndex + 1, 'a');
    };

    const handleChange = (setIndex, side, raw) => {
        const value = raw.replace(/\D/g, '').slice(0, 2);
        updateField(setIndex, side, value);
        if (value.length === 2) advance(setIndex, side, value);
    };

    const handleKeyDown = (e, setIndex, side) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            advance(setIndex, side, e.currentTarget.value);
        }
    };

    // ---------- actions ----------

    const handleSave = async (sets = entry.sets) => {
        setSaveError(null);
        try {
            await saveResult(sets);
            const decided = sets.length > 0 && !!MatchService.resolveWinnerTeamId(
                sets.map((s, i) => ({ set_number: i + 1, score_team_a: s.a, score_team_b: s.b })),
                tournament,
                match
            );
            setSavedNotice(
                sets.length === 0
                    ? 'Result cleared'
                    : decided
                        ? isStandalone ? 'Result saved' : 'Result saved · standings updated'
                        : 'Progress saved'
            );
        } catch (err) {
            setSaveError(err.message || 'Could not save the result');
        }
    };

    const handleClear = () => {
        if (!confirm('Clear all scores for this match? It will go back to unplayed.')) return;
        setDraft(emptySets(format.maxSets));
        handleSave([]);
    };

    const handleCancelEdit = () => {
        setSaveError(null);
        setDraft(() => {
            const sets = emptySets(format.maxSets);
            savedSets.slice(0, format.maxSets).forEach((s, i) => {
                sets[i] = { a: String(s.score_team_a), b: String(s.score_team_b) };
            });
            return sets;
        });
        setEditing(false);
    };

    // ---------- rendering ----------

    const renderTeamHeader = (team, side) => {
        const won = isCompleted && match.winner_team_id === (side === 'a' ? match.team_a_id : match.team_b_id);
        return (
            <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                <div style={{
                    fontSize: '17px',
                    fontWeight: 800,
                    lineHeight: 1.25,
                    color: won ? 'var(--success-color)' : 'var(--text-primary)',
                    wordBreak: 'break-word'
                }}>
                    {team.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {teamPlayers(team).map(firstName).join(' & ')}
                </div>
                {won && (
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--success-color)'
                    }}>
                        <Trophy size={13} /> Winner
                    </div>
                )}
            </div>
        );
    };

    const saveLabel = () => {
        if (entry.sets.length === 0) return 'Enter the score';
        if (entry.blocking) return 'Fix the score above';
        if (entry.winner) {
            const sets = entry.winner === 'a' ? `${entry.winsA}–${entry.winsB}` : `${entry.winsB}–${entry.winsA}`;
            return `Save · ${teamName(entry.winner)} wins${format.maxSets > 1 ? ` ${sets}` : ''}`;
        }
        return 'Save progress';
    };

    return (
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            <button onClick={() => navigate(backPath)} className="back-button">
                <ArrowLeft size={18} />
                {isStandalone ? 'Back to group' : tournament?.name || 'Back to tournament'}
            </button>

            {/* Matchup header */}
            <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span className="eyebrow" style={{ color: 'var(--accent-primary)' }}>{stageLabel}</span>
                    <span className="eyebrow">{formatLabel}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    {renderTeamHeader(teamA, 'a')}
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-muted)', paddingTop: '2px' }}>VS</div>
                    {renderTeamHeader(teamB, 'b')}
                </div>
            </div>

            {savedNotice && (
                <div className="notice notice-success" style={{ marginBottom: '16px' }}>
                    <CheckCircle size={18} style={{ flexShrink: 0 }} />
                    <span>{savedNotice}</span>
                </div>
            )}

            {saveError && (
                <div className="notice notice-error" style={{ marginBottom: '16px' }}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span>{saveError}</span>
                </div>
            )}

            {!editing ? (
                /* ---------- Result view ---------- */
                <>
                    <div className="card" style={{ padding: '16px' }}>
                        <div className="list-gap">
                            {savedSets.map((set) => (
                                <div key={set.set_number} className="score-row">
                                    <div className={`score-input ${set.score_team_a > set.score_team_b ? 'score-input-win' : ''}`}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', fontSize: '30px' }}>
                                        {set.score_team_a}
                                    </div>
                                    <span className="eyebrow" style={{ minWidth: '40px', textAlign: 'center' }}>
                                        {format.maxSets > 1 ? `Set ${set.set_number}` : '–'}
                                    </span>
                                    <div className={`score-input ${set.score_team_b > set.score_team_a ? 'score-input-win' : ''}`}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', fontSize: '30px' }}>
                                        {set.score_team_b}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => { setSavedNotice(null); setEditing(true); }}
                            className="btn-secondary btn-block"
                            style={{ marginTop: '16px' }}
                        >
                            <Pencil size={16} />
                            Edit score
                        </button>
                    </div>

                    <div className="action-bar list-gap">
                        {nextMatch && (
                            <button
                                onClick={() => { setSavedNotice(null); navigate(`/matches/${nextMatch.id}`); }}
                                className="btn-primary btn-lg btn-block"
                            >
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    Next: {nextMatch.team_a?.name} vs {nextMatch.team_b?.name}
                                </span>
                                <ChevronRight size={18} style={{ flexShrink: 0 }} />
                            </button>
                        )}
                        <button onClick={() => navigate(backPath)} className="btn-secondary btn-block">
                            {isStandalone ? 'Back to group' : 'Standings & matches'}
                        </button>
                    </div>
                </>
            ) : (
                /* ---------- Entry view ---------- */
                <>
                    <div className="card" style={{ padding: '16px' }}>
                        <div className="score-row" style={{ marginBottom: '8px' }}>
                            <span className="eyebrow" style={{ textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teamA.name}</span>
                            <span style={{ minWidth: '40px' }} />
                            <span className="eyebrow" style={{ textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teamB.name}</span>
                        </div>

                        <div className="list-gap" style={{ gap: '14px' }}>
                            {entry.rows.map((row) => {
                                const raw = draft[row.index] || { a: '', b: '' };
                                const valid = row.filled && row.validation.isValid;
                                return (
                                    <div key={row.index}>
                                        <div className="score-row">
                                            <input
                                                ref={(el) => { inputRefs.current[`${row.index}a`] = el; }}
                                                className={`score-input ${valid && row.a > row.b ? 'score-input-win' : ''}`}
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                enterKeyHint="next"
                                                autoComplete="off"
                                                placeholder="0"
                                                aria-label={`${teamA.name} set ${row.index + 1}`}
                                                value={raw.a}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => handleChange(row.index, 'a', e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(e, row.index, 'a')}
                                                disabled={saving}
                                            />
                                            <span className="eyebrow" style={{ minWidth: '40px', textAlign: 'center' }}>
                                                {format.maxSets > 1 ? `Set ${row.index + 1}` : '–'}
                                            </span>
                                            <input
                                                ref={(el) => { inputRefs.current[`${row.index}b`] = el; }}
                                                className={`score-input ${valid && row.b > row.a ? 'score-input-win' : ''}`}
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                enterKeyHint={row.index + 1 < format.maxSets ? 'next' : 'done'}
                                                autoComplete="off"
                                                placeholder="0"
                                                aria-label={`${teamB.name} set ${row.index + 1}`}
                                                value={raw.b}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => handleChange(row.index, 'b', e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(e, row.index, 'b')}
                                                disabled={saving}
                                            />
                                        </div>
                                        {row.filled && row.validation.errors.length > 0 && (
                                            <div className="notice notice-error" style={{ marginTop: '8px', padding: '8px 12px', fontSize: '13px' }}>
                                                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                                                {row.validation.errors[0]}
                                            </div>
                                        )}
                                        {row.filled && row.validation.isValid && row.validation.warnings.length > 0 && (
                                            <div className="notice notice-warning" style={{ marginTop: '8px', padding: '8px 12px', fontSize: '13px' }}>
                                                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                                                {row.validation.warnings[0]}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '14px' }}>
                            Type the loser's points and we fill in {format.winPoints} for the winner.
                            {format.maxSets > 1 && ' A deciding set appears automatically at 1–1.'}
                        </p>
                    </div>

                    <div className="action-bar">
                        <button
                            onClick={() => handleSave()}
                            disabled={saving || entry.sets.length === 0 || entry.blocking}
                            className={`${entry.winner && !entry.blocking ? 'btn-success' : 'btn-primary'} btn-lg btn-block`}
                        >
                            {saving ? <Loader2 className="animate-spin" size={18} /> : entry.winner ? <Trophy size={18} /> : <Save size={18} />}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {saving ? 'Saving…' : saveLabel()}
                            </span>
                        </button>

                        {isCompleted && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                <button onClick={handleClear} className="btn-link" disabled={saving}>
                                    Clear result
                                </button>
                                <button onClick={handleCancelEdit} className="btn-link" disabled={saving}>
                                    <X size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> Cancel edit
                                </button>
                            </div>
                        )}
                        {!isCompleted && savedSets.length > 0 && (
                            <div style={{ textAlign: 'center', marginTop: '6px' }}>
                                <button onClick={handleClear} className="btn-link" disabled={saving}>
                                    Clear scores
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default MatchDetail;
