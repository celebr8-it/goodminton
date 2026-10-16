/**
 * Player / team naming helpers
 */

export const playerDisplayName = (player) =>
  player?.full_name?.trim() || player?.email?.split("@")[0] || "Player";

export const firstName = (player) => playerDisplayName(player).split(/\s+/)[0];

/**
 * Build a default team name from its players' first names, e.g. "Ravi & Sahith"
 * @param {Array} players - Player objects with full_name / email
 */
export const autoTeamName = (players) => {
  const names = players.filter(Boolean).map(firstName);
  if (names.length === 0) return "";
  return names.join(" & ");
};

/** Players of a team regardless of whether the join was aliased as `players` or `player` */
export const teamPlayers = (team) =>
  team?.team_members?.map((tm) => tm.players || tm.player).filter(Boolean) || [];
