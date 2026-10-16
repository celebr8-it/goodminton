/**
 * Tournament Service
 * Business logic layer for tournament operations
 * Handles tournament lifecycle and match generation
 */

import { supabase } from "../lib/supabase";
import { TOURNAMENT_STATUS, SCORING_TYPES } from "../lib/constants";
import { MatchService } from "./MatchService";
import { autoTeamName } from "../lib/names";

export const MATCH_STAGE = {
  LEAGUE: "league",
  PLAYOFF: "playoff",
};

const isPlayoff = (match) => match.stage === MATCH_STAGE.PLAYOFF;
const slotKey = (roundSize, slot) => `${roundSize}:${slot}`;

/** Fisher-Yates shuffle (returns a new array) */
const shuffle = (list) => {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Tournament Business Logic Service
 * Orchestrates tournament operations following business rules
 */
export class TournamentService {
  /**
   * Get tournament with full details
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise<Object>} Tournament with related data
   */
  static async getTournamentById(tournamentId) {
    const { data, error } = await supabase
      .from("tournaments")
      .select(
        `
        *,
        group:groups(*)
      `
      )
      .eq("id", tournamentId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get all teams for a tournament with member details
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise<Array>} Array of teams
   */
  static async getTournamentTeams(tournamentId) {
    const { data, error } = await supabase
      .from("teams")
      .select(
        `
        *,
        team_members(
          player_id,
          players(
            id,
            full_name,
            email,
            avatar_url
          )
        )
      `
      )
      .eq("tournament_id", tournamentId)
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get all tournaments for a user (from groups they belong to)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of tournaments with group info
   */
  static async getUserTournaments(userId) {
    // First get all groups the user is a member of
    const { data: memberGroups, error: memberError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("player_id", userId);

    if (memberError) throw memberError;

    const groupIds = memberGroups?.map((g) => g.group_id) || [];

    if (groupIds.length === 0) {
      return [];
    }

    // Get all tournaments for those groups
    const { data, error } = await supabase
      .from("tournaments")
      .select("*, groups(name, image_url)")
      .in("group_id", groupIds)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new tournament
   * @param {Object} params - Tournament creation parameters
   * @param {string} params.groupId - Group ID
   * @param {string} params.name - Tournament name
   * @param {string} params.scoringType - Scoring type
   * @returns {Promise<Object>} Created tournament
   */
  static async createTournament({ groupId, name, scoringType = "standard_21" }) {
    const { data, error } = await supabase
      .from("tournaments")
      .insert([
        {
          group_id: groupId,
          name: name,
          scoring_type: scoringType,
          status: TOURNAMENT_STATUS.DRAFT,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a team in a tournament
   * @param {string} tournamentId - Tournament ID
   * @param {string} name - Team name
   * @returns {Promise<Object>} Created team
   */
  static async createTeam(tournamentId, name) {
    const { data, error } = await supabase
      .from("teams")
      .insert([{ tournament_id: tournamentId, name: name }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Add a player to a team
   * @param {string} teamId - Team ID
   * @param {string} playerId - Player ID
   * @returns {Promise<Object>} Created team member
   */
  static async addTeamMember(teamId, playerId) {
    const { data, error } = await supabase
      .from("team_members")
      .insert([{ team_id: teamId, player_id: playerId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a team
   * @param {string} teamId - Team ID
   * @returns {Promise<void>}
   */
  static async deleteTeam(teamId) {
    const { error } = await supabase.from("teams").delete().eq("id", teamId);

    if (error) throw error;
  }

  /**
   * Delete all teams in a tournament
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise<void>}
   */
  static async deleteAllTeams(tournamentId) {
    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("tournament_id", tournamentId);

    if (error) throw error;
  }

  /**
   * Generate random teams from members
   * @param {string} tournamentId - Tournament ID
   * @param {Array} members - Array of member objects with id property
   * @returns {Promise<Array>} Created teams
   */
  static async generateRandomTeams(tournamentId, members) {
    if (members.length < 4) {
      throw new Error("Need at least 4 members to generate teams");
    }

    const shuffled = shuffle(members);
    const pairs = [];
    for (let i = 0; i + 1 < shuffled.length; i += 2) {
      pairs.push([shuffled[i], shuffled[i + 1]]);
    }
    return this.createTeamsFromPairs(tournamentId, pairs);
  }

  /**
   * Pair players from two skill buckets.
   * Both buckets are laid out end to end (bucket 1 best → worst, then bucket 2
   * best → worst) and paired from the outside in, so the best player gets the
   * weakest, the 2nd best the 2nd weakest, and so on. Players only share a team
   * with someone from their own bucket when the buckets are uneven.
   * With `shuffle`, each bucket is shuffled first: pairs are random but still
   * cross-bucket wherever possible.
   * @param {Array} bucketA - Strong players, ranked best first
   * @param {Array} bucketB - Moderate/developing players, ranked best first
   * @param {Object} options - { shuffle: boolean }
   * @returns {{pairs: Array<[Object, Object]>, sittingOut: Object|null}}
   */
  static buildBucketPairs(bucketA, bucketB, { shuffle: randomize = false } = {}) {
    const order = (list) => (randomize ? shuffle(list) : [...list]);
    const lineup = [...order(bucketA), ...order(bucketB)];
    const pairs = [];
    let low = 0;
    let high = lineup.length - 1;
    while (low < high) {
      pairs.push([lineup[low], lineup[high]]);
      low++;
      high--;
    }
    return { pairs, sittingOut: low === high ? lineup[low] : null };
  }

  /**
   * Replace all teams in a tournament with the given player pairs
   * @param {string} tournamentId - Tournament ID
   * @param {Array<[Object, Object]>} pairs - Player pairs
   * @returns {Promise<Array>} Created teams
   */
  static async createTeamsFromPairs(tournamentId, pairs) {
    await this.deleteAllTeams(tournamentId);

    const createdTeams = [];
    for (const pair of pairs) {
      const team = await this.createTeam(tournamentId, autoTeamName(pair));
      for (const player of pair) {
        await this.addTeamMember(team.id, player.id);
      }
      createdTeams.push(team);
    }
    return createdTeams;
  }


  /**
   * Start tournament - Generate all matches (Round Robin)
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise<Object>} Result with match count
   */
  static async startTournament(tournamentId) {
    // Get tournament and teams
    const tournament = await this.getTournamentById(tournamentId);
    const teams = await this.getTournamentTeams(tournamentId);

    // Validation
    if (tournament.status !== TOURNAMENT_STATUS.DRAFT) {
      throw new Error("Tournament already started");
    }

    if (teams.length < 2) {
      throw new Error("Need at least 2 teams to start tournament");
    }

    // Generate round-robin matches using the circle method
    // This ensures teams don't play consecutive matches
    const matches = [];
    const teamList = [...teams];
    
    // If odd number of teams, add a "bye" placeholder
    const hasBye = teamList.length % 2 !== 0;
    if (hasBye) {
      teamList.push(null); // null represents a bye
    }
    
    const n = teamList.length;
    const rounds = n - 1;
    const matchesPerRound = n / 2;
    
    // Generate matches round by round using circle method
    for (let round = 0; round < rounds; round++) {
      for (let match = 0; match < matchesPerRound; match++) {
        const home = match;
        const away = n - 1 - match;
        
        // Skip if either team is a bye
        if (teamList[home] && teamList[away]) {
          matches.push({
            tournament_id: tournamentId,
            team_a_id: teamList[home].id,
            team_b_id: teamList[away].id,
          });
        }
      }
      
      // Rotate teams (keep first team fixed, rotate the rest)
      const lastTeam = teamList.pop();
      teamList.splice(1, 0, lastTeam);
    }
    
    // Shuffle matches slightly within constraints to add variety
    // but maintain reasonable spacing between same-team matches
    const shuffledMatches = this.shuffleMatchesWithSpacing(matches).map(
      (match, index) => ({ ...match, match_order: index + 1 })
    );

    // Insert all matches
    const { data: createdMatches, error: matchError } = await supabase
      .from("matches")
      .insert(shuffledMatches)
      .select();

    if (matchError) throw matchError;

    // Update tournament status
    const { data: updatedTournament, error: updateError } = await supabase
      .from("tournaments")
      .update({ status: TOURNAMENT_STATUS.ACTIVE })
      .eq("id", tournamentId)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      tournament: updatedTournament,
      matchCount: createdMatches.length,
      teamCount: teams.length,
    };
  }

  /**
   * Shuffle matches while maintaining reasonable spacing between same-team matches
   * This prevents any team from playing consecutive matches
   * @param {Array} matches - Array of match objects
   * @returns {Array} Reordered matches
   */
  static shuffleMatchesWithSpacing(matches) {
    if (matches.length <= 2) return matches;
    
    const result = [];
    const remaining = [...matches];
    const recentTeams = new Set(); // Track teams that just played
    
    while (remaining.length > 0) {
      // Find a match where neither team just played
      let bestMatchIndex = -1;
      
      for (let i = 0; i < remaining.length; i++) {
        const match = remaining[i];
        const teamA = match.team_a_id;
        const teamB = match.team_b_id;
        
        if (!recentTeams.has(teamA) && !recentTeams.has(teamB)) {
          bestMatchIndex = i;
          break;
        }
      }
      
      // If no ideal match found, just take the first one
      if (bestMatchIndex === -1) {
        bestMatchIndex = 0;
      }
      
      const selectedMatch = remaining.splice(bestMatchIndex, 1)[0];
      result.push(selectedMatch);
      
      // Update recent teams (only track the last played teams)
      recentTeams.clear();
      recentTeams.add(selectedMatch.team_a_id);
      recentTeams.add(selectedMatch.team_b_id);
    }
    
    return result;
  }

  /**
   * Calculate tournament standings
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise<Array>} Sorted standings
   */
  static async calculateStandings(tournamentId, preloaded = {}) {
    const teams =
      preloaded.teams || (await this.getTournamentTeams(tournamentId));
    const allMatches =
      preloaded.matches ||
      (await MatchService.getMatchesByTournament(tournamentId));
    // Only league games count towards the table; playoffs are knockout
    const matches = allMatches.filter((m) => !isPlayoff(m));

    // Initialize standings
    const standings = teams.map((team) => ({
      team,
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      setsWon: 0,
      setsLost: 0,
      pointsWon: 0,
      pointsLost: 0,
      points: 0, // Win = 2 points, Draw = 1 point (if applicable)
    }));

    const standingsMap = new Map(standings.map((s) => [s.team.id, s]));

    // Process completed matches
    matches.forEach((match) => {
      if (!match.winner_team_id) return; // Skip incomplete matches

      const teamAStats = standingsMap.get(match.team_a_id);
      const teamBStats = standingsMap.get(match.team_b_id);

      if (!teamAStats || !teamBStats) return;

      // Count matches
      teamAStats.matchesPlayed++;
      teamBStats.matchesPlayed++;

      // Calculate set scores
      let teamASets = 0;
      let teamBSets = 0;
      let teamAPoints = 0;
      let teamBPoints = 0;

      match.match_sets?.forEach((set) => {
        teamAPoints += set.score_team_a;
        teamBPoints += set.score_team_b;

        if (set.score_team_a > set.score_team_b) {
          teamASets++;
        } else if (set.score_team_b > set.score_team_a) {
          teamBSets++;
        }
      });

      teamAStats.setsWon += teamASets;
      teamAStats.setsLost += teamBSets;
      teamAStats.pointsWon += teamAPoints;
      teamAStats.pointsLost += teamBPoints;

      teamBStats.setsWon += teamBSets;
      teamBStats.setsLost += teamASets;
      teamBStats.pointsWon += teamBPoints;
      teamBStats.pointsLost += teamAPoints;

      // Award match win
      if (match.winner_team_id === match.team_a_id) {
        teamAStats.matchesWon++;
        teamAStats.points += 2;
        teamBStats.matchesLost++;
      } else {
        teamBStats.matchesWon++;
        teamBStats.points += 2;
        teamAStats.matchesLost++;
      }
    });

    // Sort standings: Points > Matches Won > Set Difference > Point Difference
    return standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;

      const aSetDiff = a.setsWon - a.setsLost;
      const bSetDiff = b.setsWon - b.setsLost;
      if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;

      const aPointDiff = a.pointsWon - a.pointsLost;
      const bPointDiff = b.pointsWon - b.pointsLost;
      return bPointDiff - aPointDiff;
    });
  }

  /**
   * Complete tournament
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise<Object>} Updated tournament
   */
  static async completeTournament(tournamentId) {
    const matches = await MatchService.getMatchesByTournament(tournamentId);

    // Check all matches are complete
    const incompleteMatches = matches.filter((m) => !m.winner_team_id);
    if (incompleteMatches.length > 0) {
      throw new Error(
        `${incompleteMatches.length} matches are still incomplete`
      );
    }

    const { data, error } = await supabase
      .from("tournaments")
      .update({ status: TOURNAMENT_STATUS.COMPLETED })
      .eq("id", tournamentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Check if user can manage tournament
   * @param {string} tournamentId - Tournament ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if user is group owner
   */
  static async canManageTournament(tournamentId, userId) {
    const { data, error } = await supabase
      .from("tournaments")
      .select("group:groups(owner_id)")
      .eq("id", tournamentId)
      .single();

    if (error) return false;
    return data?.group?.owner_id === userId;
  }

  /**
   * Delete a tournament
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise<void>}
   */
  static async deleteTournament(tournamentId) {
    const { error } = await supabase
      .from("tournaments")
      .delete()
      .eq("id", tournamentId);

    if (error) throw error;
  }

  /**
   * Create a custom match between two teams in a tournament
   * @param {string} tournamentId - Tournament ID
   * @param {string} teamAId - Team A ID
   * @param {string} teamBId - Team B ID
   * @returns {Promise<Object>} Created match
   */
  static async createCustomMatch(tournamentId, teamAId, teamBId) {
    if (teamAId === teamBId) {
      throw new Error("Cannot create a match between the same team");
    }

    const { data, error } = await supabase
      .from("matches")
      .insert({
        tournament_id: tournamentId,
        team_a_id: teamAId,
        team_b_id: teamBId
      })
      .select(`
        *,
        team_a:teams!matches_team_a_id_fkey(*),
        team_b:teams!matches_team_b_id_fkey(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // ==================== PLAYOFFS ====================

  /**
   * Human label for a playoff round
   * @param {number} roundSize - Teams in the round
   */
  static getRoundLabel(roundSize) {
    if (roundSize === 2) return "Final";
    if (roundSize === 4) return "Semi-final";
    if (roundSize === 8) return "Quarter-final";
    return `Round of ${roundSize}`;
  }

  /**
   * Bracket sizes available for a given number of teams (powers of two)
   */
  static getPlayoffOptions(teamCount) {
    return [2, 4, 8, 16].filter((n) => n <= teamCount);
  }

  /**
   * Sensible default: biggest bracket that still eliminates someone in the league
   * (3-4 teams → final, 5-8 teams → semis, 9+ → quarters)
   */
  static getDefaultPlayoffSize(teamCount) {
    const options = this.getPlayoffOptions(teamCount);
    const eliminating = options.filter((n) => n < teamCount);
    return eliminating[eliminating.length - 1] || options[0] || 2;
  }

  /**
   * Standard seeding order so the top seeds can only meet in the final.
   * 4 → [1,4,2,3], 8 → [1,8,4,5,2,7,3,6]
   */
  static seedOrder(size) {
    let seeds = [1, 2];
    while (seeds.length < size) {
      const total = seeds.length * 2 + 1;
      seeds = seeds.flatMap((seed) => [seed, total - seed]);
    }
    return seeds;
  }

  /**
   * First-round pairings for a bracket, from the current standings
   * @param {Array} standings - Sorted standings
   * @param {number} size - Number of qualifying teams
   * @returns {Array<{slot, seedA, seedB, teamA, teamB}>}
   */
  static buildPlayoffPairings(standings, size) {
    const order = this.seedOrder(size);
    const pairings = [];
    for (let slot = 0; slot < size / 2; slot++) {
      const seedA = order[slot * 2];
      const seedB = order[slot * 2 + 1];
      pairings.push({
        slot,
        seedA,
        seedB,
        teamA: standings[seedA - 1]?.team,
        teamB: standings[seedB - 1]?.team,
      });
    }
    return pairings;
  }

  /**
   * Seed number (league position) of every qualified team, keyed by team id
   */
  static getPlayoffSeeds(matches) {
    const playoffs = matches.filter(isPlayoff);
    if (playoffs.length === 0) return new Map();

    const firstRound = Math.max(...playoffs.map((m) => m.round_size));
    const order = this.seedOrder(firstRound);
    const seeds = new Map();
    playoffs
      .filter((m) => m.round_size === firstRound)
      .forEach((m) => {
        seeds.set(m.team_a_id, order[m.bracket_slot * 2]);
        seeds.set(m.team_b_id, order[m.bracket_slot * 2 + 1]);
      });
    return seeds;
  }

  /**
   * Generate the first playoff round from the league table.
   * @param {string} tournamentId - Tournament ID
   * @param {number} size - Number of qualifying teams (2, 4, 8, 16)
   */
  static async generatePlayoffs(tournamentId, size) {
    const [tournament, teams, matches] = await Promise.all([
      this.getTournamentById(tournamentId),
      this.getTournamentTeams(tournamentId),
      MatchService.getMatchesByTournament(tournamentId),
    ]);

    if (tournament.status !== TOURNAMENT_STATUS.ACTIVE) {
      throw new Error("Playoffs can only start while the tournament is active");
    }
    if (matches.some(isPlayoff)) {
      throw new Error("Playoffs have already started");
    }
    const pending = matches.filter((m) => !m.winner_team_id).length;
    if (pending > 0) {
      throw new Error(`Finish the remaining ${pending} league matches first`);
    }
    if (!this.getPlayoffOptions(teams.length).includes(size)) {
      throw new Error(`Can't run a ${size}-team playoff with ${teams.length} teams`);
    }

    const standings = await this.calculateStandings(tournamentId, {
      teams,
      matches,
    });

    const rows = this.buildPlayoffPairings(standings, size).map((p) => ({
      tournament_id: tournamentId,
      team_a_id: p.teamA.id,
      team_b_id: p.teamB.id,
      stage: MATCH_STAGE.PLAYOFF,
      round_size: size,
      bracket_slot: p.slot,
      status: "scheduled",
    }));

    const { data, error } = await supabase.from("matches").insert(rows).select();
    if (error) {
      if (error.code === "23505") throw new Error("Playoffs have already started");
      if (error.code === "42703" || error.code === "PGRST204") {
        throw new Error(
          "Database is missing playoff columns. Run migration_playoffs.sql in Supabase."
        );
      }
      throw error;
    }
    return data;
  }

  /**
   * Find the bracket slot a playoff winner advances to
   */
  static getNextSlot(match) {
    if (!isPlayoff(match) || match.round_size <= 2) return null;
    return {
      roundSize: match.round_size / 2,
      slot: Math.floor(match.bracket_slot / 2),
    };
  }

  /**
   * Block changing a playoff winner once the following round has been played,
   * otherwise the bracket would contain a team that was knocked out.
   * @param {Object} match - Playoff match being edited
   * @param {string|null} newWinnerTeamId - Winner after the edit
   */
  static async assertPlayoffEditable(match, newWinnerTeamId) {
    const next = this.getNextSlot(match);
    if (!next || !match.winner_team_id) return;
    if (match.winner_team_id === newWinnerTeamId) return;

    const { data, error } = await supabase
      .from("matches")
      .select("id, winner_team_id, match_sets(id)")
      .eq("tournament_id", match.tournament_id)
      .eq("stage", MATCH_STAGE.PLAYOFF)
      .eq("round_size", next.roundSize)
      .eq("bracket_slot", next.slot)
      .maybeSingle();

    if (error) throw error;
    if (data && (data.winner_team_id || data.match_sets?.length > 0)) {
      throw new Error(
        `This changes the winner, but the ${this.getRoundLabel(
          next.roundSize
        ).toLowerCase()} after it already has a score. Clear that score first.`
      );
    }
  }

  /**
   * Bring the bracket in line with results: create next-round matches once both
   * feeder matches are decided, fix teams if a result was edited, remove
   * unplayed matches whose feeders were re-opened, and complete/re-open the
   * tournament based on the final.
   * Safe to call repeatedly (e.g. from several phones).
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise<{championTeamId: string|null, changed: boolean}>}
   */
  static async syncPlayoffs(tournamentId) {
    const matches = (await MatchService.getMatchesByTournament(tournamentId)).filter(
      isPlayoff
    );
    if (matches.length === 0) return { championTeamId: null, changed: false };

    const bySlot = new Map(
      matches.map((m) => [slotKey(m.round_size, m.bracket_slot), m])
    );
    const hasPlay = (m) => !!m && (!!m.winner_team_id || m.match_sets?.length > 0);
    let changed = false;

    const firstRound = Math.max(...matches.map((m) => m.round_size));
    for (let size = firstRound; size > 2; size /= 2) {
      for (let slot = 0; slot < size / 4; slot++) {
        const feederA = bySlot.get(slotKey(size, slot * 2));
        const feederB = bySlot.get(slotKey(size, slot * 2 + 1));
        const nextKey = slotKey(size / 2, slot);
        const next = bySlot.get(nextKey);
        const teamA = feederA?.winner_team_id;
        const teamB = feederB?.winner_team_id;

        if (teamA && teamB) {
          if (!next) {
            const { data, error } = await supabase
              .from("matches")
              .insert({
                tournament_id: tournamentId,
                team_a_id: teamA,
                team_b_id: teamB,
                stage: MATCH_STAGE.PLAYOFF,
                round_size: size / 2,
                bracket_slot: slot,
                status: "scheduled",
              })
              .select()
              .single();
            // 23505: another phone created it first, it shows up on the next refresh
            if (error && error.code !== "23505") throw error;
            if (data) bySlot.set(nextKey, { ...data, match_sets: [] });
            changed = true;
          } else if (
            !hasPlay(next) &&
            (next.team_a_id !== teamA || next.team_b_id !== teamB)
          ) {
            const { error } = await supabase
              .from("matches")
              .update({ team_a_id: teamA, team_b_id: teamB })
              .eq("id", next.id);
            if (error) throw error;
            bySlot.set(nextKey, { ...next, team_a_id: teamA, team_b_id: teamB });
            changed = true;
          }
        } else if (next && !hasPlay(next)) {
          const { error } = await supabase.from("matches").delete().eq("id", next.id);
          if (error) throw error;
          bySlot.delete(nextKey);
          changed = true;
        }
      }
    }

    const championTeamId = bySlot.get(slotKey(2, 0))?.winner_team_id || null;
    const tournament = await this.getTournamentById(tournamentId);
    const desiredStatus = championTeamId
      ? TOURNAMENT_STATUS.COMPLETED
      : TOURNAMENT_STATUS.ACTIVE;
    if (tournament.status !== desiredStatus) {
      const { error } = await supabase
        .from("tournaments")
        .update({ status: desiredStatus })
        .eq("id", tournamentId);
      if (error) throw error;
      changed = true;
    }

    return { championTeamId, changed };
  }
}
