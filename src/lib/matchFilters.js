import { playerDisplayName, teamPlayers } from './names.js';

/** Match every search word across both teams, their players and the match label. */
export const matchesFilters = (match, { query, teamId, status }, teamsById, label) => {
    if (teamId && match.team_a_id !== teamId && match.team_b_id !== teamId) return false;
    if (status === 'pending' && match.winner_team_id) return false;
    if (status === 'played' && !match.winner_team_id) return false;

    const text = [
        label,
        ...['a', 'b'].flatMap(side => {
            const team = teamsById.get(match[`team_${side}_id`]) || match[`team_${side}`];
            return [team?.name || '', ...teamPlayers(team).map(playerDisplayName)];
        })
    ].join(' ').toLocaleLowerCase();

    return query.trim().toLocaleLowerCase().split(/\s+/).every(word => text.includes(word));
};
