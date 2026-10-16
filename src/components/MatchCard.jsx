/**
 * Match Card
 * Compact two-line scoreboard row: team names, players, and per-set scores.
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { firstName, teamPlayers } from '../lib/names';

const sortedSets = (match) =>
    [...(match.match_sets || [])].sort((a, b) => a.set_number - b.set_number);

const TeamLine = ({ team, teamId, sets, side, match, seed }) => {
    const decided = !!match.winner_team_id;
    const isWinner = decided && match.winner_team_id === teamId;
    const players = teamPlayers(team).map(firstName).join(' & ');

    return (
        <div className={`match-line ${isWinner ? 'is-winner' : ''} ${decided && !isWinner ? 'is-loser' : ''}`}>
            <div className="match-team">
                {seed && <span className="seed">{seed}</span>}
                <div className="match-team-text">
                    <div className="match-team-name">
                        {team?.name || 'TBD'}
                        {isWinner && ' ✓'}
                    </div>
                    {players && players !== team?.name && (
                        <div className="match-team-players">{players}</div>
                    )}
                </div>
            </div>
            <div className="match-scores">
                {sets.map((set) => {
                    const mine = side === 'a' ? set.score_team_a : set.score_team_b;
                    const theirs = side === 'a' ? set.score_team_b : set.score_team_a;
                    return (
                        <span key={set.set_number} className={mine > theirs ? 'set-won' : ''}>
                            {mine}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

/**
 * @param {Object} match - Match row with match_sets
 * @param {Map} teamsById - Full team objects (with team_members) keyed by id
 * @param {string} label - Small heading above the teams
 * @param {boolean} highlight - Emphasise as the next match to play
 * @param {Map} seeds - Optional playoff seeds keyed by team id
 * @param {Function} onClick - Open the match
 */
const MatchCard = ({ match, teamsById, label, highlight = false, seeds, onClick, action }) => {
    const sets = sortedSets(match);
    const teamA = teamsById.get(match.team_a_id) || match.team_a;
    const teamB = teamsById.get(match.team_b_id) || match.team_b;

    return (
        <button
            type="button"
            className={`match-card ${highlight ? 'match-card-next' : ''}`}
            onClick={onClick}
        >
            {label && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="eyebrow" style={highlight ? { color: 'var(--accent-primary)' } : undefined}>
                        {label}
                    </span>
                    {!action && <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
                </div>
            )}
            <TeamLine team={teamA} teamId={match.team_a_id} sets={sets} side="a" match={match} seed={seeds?.get(match.team_a_id)} />
            <TeamLine team={teamB} teamId={match.team_b_id} sets={sets} side="b" match={match} seed={seeds?.get(match.team_b_id)} />
            {action && <div style={{ marginTop: '10px' }}>{action}</div>}
        </button>
    );
};

export default MatchCard;
