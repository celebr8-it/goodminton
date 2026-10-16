/**
 * Match Service
 * Business logic layer for match operations
 * Follows Single Responsibility Principle
 */

import { supabase } from "../lib/supabase";
import { MATCH_STATUS, SCORING_TYPES } from "../lib/constants";

/**
 * Match Business Logic Service
 * Handles all match-related operations with validation and error handling
 */
export class MatchService {
  /**
   * Create a new match between two teams
   * @param {Object} params - Match creation parameters
   * @param {string} params.tournamentId - Tournament ID
   * @param {string} params.teamAId - First team ID
   * @param {string} params.teamBId - Second team ID
   * @returns {Promise<Object>} Created match
   */
  static async createMatch({ tournamentId, teamAId, teamBId }) {
    if (teamAId === teamBId) {
      throw new Error("Teams must be different");
    }

    const { data, error } = await supabase
      .from("matches")
      .insert([
        {
          tournament_id: tournamentId,
          team_a_id: teamAId,
          team_b_id: teamBId,
          status: MATCH_STATUS.SCHEDULED,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get match with full details (teams, sets, players)
   * @param {string} matchId - Match ID
   * @returns {Promise<Object>} Match with related data
   */
  static async getMatchById(matchId) {
    const { data, error } = await supabase
      .from("matches")
      .select(
        `
        *,
        tournament:tournaments(*),
        group:groups(*),
        team_a:teams!matches_team_a_id_fkey(
          *,
          team_members(
            player:players(*)
          )
        ),
        team_b:teams!matches_team_b_id_fkey(
          *,
          team_members(
            player:players(*)
          )
        ),
        match_sets(*)
      `
      )
      .eq("id", matchId)
      .single();

    if (error) throw error;

    // For standalone matches, create tournament object from match's scoring_type
    if (!data.tournament && data.group) {
      const scoringType = data.scoring_type || "standard_21";
      const isSingleSet =
        scoringType === "single_21" || scoringType === "single_30";

      data.tournament = {
        scoring_type: scoringType,
        max_sets: isSingleSet ? 1 : 3,
        win_points: scoringType === "single_30" ? 30 : 21,
      };
    }

    return data;
  }

  /**
   * Get all matches for a tournament
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise<Array>} Array of matches
   */
  static async getMatchesByTournament(tournamentId) {
    const { data, error } = await supabase
      .from("matches")
      .select(
        `
        *,
        team_a:teams!matches_team_a_id_fkey(*),
        team_b:teams!matches_team_b_id_fkey(*),
        match_sets(*)
      `
      )
      .eq("tournament_id", tournamentId)
      .order("match_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get the next unplayed match in a tournament (for back-to-back entry)
   * @param {string} tournamentId - Tournament ID
   * @param {string} excludeMatchId - Match to skip (usually the current one)
   * @returns {Promise<Object|null>} Next pending match or null
   */
  static async getNextPendingMatch(tournamentId, excludeMatchId) {
    const { data, error } = await supabase
      .from("matches")
      .select(
        `
        id, stage, round_size,
        team_a:teams!matches_team_a_id_fkey(id, name),
        team_b:teams!matches_team_b_id_fkey(id, name)
      `
      )
      .eq("tournament_id", tournamentId)
      .is("winner_team_id", null)
      .neq("id", excludeMatchId)
      // Playoff matches only exist once the league is done, so they come first
      .order("stage", { ascending: false })
      .order("match_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })
      .limit(1);

    if (error) throw error;
    return data?.[0] || null;
  }

  /**
   * Record a set score for a match
   * @param {Object} params - Set score parameters
   * @param {string} params.matchId - Match ID
   * @param {number} params.setNumber - Set number (1, 2, 3)
   * @param {number} params.scoreTeamA - Team A score
   * @param {number} params.scoreTeamB - Team B score
   * @returns {Promise<Object>} Created/updated set
   */
  static async recordSetScore({ matchId, setNumber, scoreTeamA, scoreTeamB }) {
    // Validation
    if (scoreTeamA < 0 || scoreTeamB < 0) {
      throw new Error("Scores cannot be negative");
    }

    if (setNumber < 1 || setNumber > 5) {
      throw new Error("Set number must be between 1 and 5");
    }

    const { data, error } = await supabase
      .from("match_sets")
      .upsert(
        [
          {
            match_id: matchId,
            set_number: setNumber,
            score_team_a: scoreTeamA,
            score_team_b: scoreTeamB,
          },
        ],
        {
          onConflict: "match_id,set_number",
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Calculate match winner based on sets
   * Follows badminton rules: Best of 3 or single set
   * @param {Array} sets - Array of match sets
   * @param {Object} tournament - Tournament configuration
   * @returns {Object|null} Winner info or null if incomplete
   */
  static calculateMatchWinner(sets, tournament) {
    if (!sets || sets.length === 0) return null;

    const sortedSets = [...sets].sort((a, b) => a.set_number - b.set_number);
    let teamAWins = 0;
    let teamBWins = 0;

    // Count set wins
    sortedSets.forEach((set) => {
      if (set.score_team_a > set.score_team_b) {
        teamAWins++;
      } else if (set.score_team_b > set.score_team_a) {
        teamBWins++;
      }
    });

    // Check if single set mode based on scoring_type
    const isSingleSet = tournament.scoring_type === 'single_21' || tournament.scoring_type === 'single_30';
    const maxSets = isSingleSet ? 1 : (tournament.max_sets || 3);
    const setsToWin = Math.ceil(maxSets / 2);

    // Check if match is complete
    if (teamAWins >= setsToWin) {
      return {
        winnerId: "team_a",
        setsWon: teamAWins,
        setsLost: teamBWins,
        isComplete: true,
      };
    }

    if (teamBWins >= setsToWin) {
      return {
        winnerId: "team_b",
        setsWon: teamBWins,
        setsLost: teamAWins,
        isComplete: true,
      };
    }

    return {
      winnerId: null,
      setsWon: Math.max(teamAWins, teamBWins),
      setsLost: Math.min(teamAWins, teamBWins),
      isComplete: false,
    };
  }

  /**
   * Complete a match and set the winner
   * @param {Object} params - Match completion parameters
   * @param {string} params.matchId - Match ID
   * @param {string} params.winnerTeamId - Winner team ID
   * @returns {Promise<Object>} Updated match
   */
  static async completeMatch({ matchId, winnerTeamId }) {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("matches")
      .update({
        winner_team_id: winnerTeamId,
        status: MATCH_STATUS.COMPLETED,
        end_time: now,
      })
      .eq("id", matchId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Start a match
   * @param {string} matchId - Match ID
   * @returns {Promise<Object>} Updated match
   */
  static async startMatch(matchId) {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("matches")
      .update({
        status: MATCH_STATUS.IN_PROGRESS,
        start_time: now,
      })
      .eq("id", matchId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a match set
   * @param {string} matchId - Match ID
   * @param {number} setNumber - Set number to delete
   * @returns {Promise<void>}
   */
  static async deleteSet(matchId, setNumber) {
    const { error } = await supabase
      .from("match_sets")
      .delete()
      .eq("match_id", matchId)
      .eq("set_number", setNumber);

    if (error) throw error;
  }

  /**
   * Resolve set format for a tournament or standalone match config
   * @param {Object} config - Tournament (or synthesized) config with scoring_type
   * @returns {{maxSets: number, winPoints: number, cap: number}}
   */
  static getMatchFormat(config) {
    const scoringType = config?.scoring_type || "standard_21";
    const isSingleSet =
      scoringType === "single_21" || scoringType === "single_30";
    const winPoints =
      scoringType === "single_30" ? 30 : config?.win_points || 21;

    return {
      maxSets: isSingleSet ? 1 : config?.max_sets || 3,
      winPoints,
      // Badminton caps deuce at 30 for 21-point sets
      cap: winPoints === 21 ? 30 : winPoints,
    };
  }

  /**
   * Validate a set score.
   * Errors block saving; warnings flag scores that break deuce rules but are allowed
   * (casual games don't always play strict deuce).
   * @param {number} scoreA - Team A score
   * @param {number} scoreB - Team B score
   * @param {Object} config - Tournament configuration
   * @returns {{isValid: boolean, errors: string[], warnings: string[]}}
   */
  static validateSetScore(scoreA, scoreB, config) {
    const { winPoints, cap } = this.getMatchFormat(config);
    const errors = [];
    const warnings = [];

    if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB)) {
      errors.push("Enter both scores");
    } else if (scoreA < 0 || scoreB < 0) {
      errors.push("Scores cannot be negative");
    } else if (scoreA === scoreB) {
      errors.push("A set can't end in a tie");
    } else {
      const winner = Math.max(scoreA, scoreB);
      const loser = Math.min(scoreA, scoreB);

      if (winner < winPoints) {
        errors.push(`Winner needs at least ${winPoints}`);
      } else {
        const standard =
          (winner === winPoints && loser <= winPoints - 2) ||
          (winner > winPoints &&
            winner <= cap &&
            (winner - loser === 2 || (winner === cap && loser === cap - 1)));
        if (!standard) {
          warnings.push(
            winner === winPoints
              ? `At ${winPoints - 1}-all a set is won by 2 points`
              : "Unusual deuce score, please double-check"
          );
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Suggest the opponent's score when the typed score can only be the loser's,
   * e.g. 15 → 21, 20 → 22 (for 21-point sets). Scores of 21+ are ambiguous.
   */
  static suggestOpponentScore(score, config) {
    const { winPoints, cap } = this.getMatchFormat(config);
    if (!Number.isInteger(score) || score < 0) return null;
    if (score <= winPoints - 2) return winPoints;
    if (score === winPoints - 1 && cap > winPoints) return winPoints + 1;
    return null;
  }

  /**
   * Work out the winning team id from a list of set scores
   * @param {Array<{score_team_a:number, score_team_b:number, set_number:number}>} sets
   * @param {Object} config - Tournament configuration
   * @param {Object} match - Match with team_a_id / team_b_id
   * @returns {string|null} Winner team ID or null if undecided
   */
  static resolveWinnerTeamId(sets, config, match) {
    const result = this.calculateMatchWinner(sets, config);
    if (!result?.isComplete) return null;
    return result.winnerId === "team_a" ? match.team_a_id : match.team_b_id;
  }

  /**
   * Save the full result of a match in one go: replaces all set scores
   * and completes (or re-opens) the match depending on whether a winner is decided.
   * @param {Object} params
   * @param {Object} params.match - Current match row
   * @param {Array<{a:number, b:number}>} params.sets - Set scores in order
   * @param {Object} params.config - Tournament configuration
   * @returns {Promise<Object>} Updated match
   */
  static async saveMatchResult({ match, sets, config }) {
    const rows = sets.map((s, i) => ({
      match_id: match.id,
      set_number: i + 1,
      score_team_a: s.a,
      score_team_b: s.b,
    }));

    if (rows.length > 0) {
      const { error: upsertError } = await supabase
        .from("match_sets")
        .upsert(rows, { onConflict: "match_id,set_number" });
      if (upsertError) throw upsertError;
    }

    // Drop sets that no longer exist (e.g. a 3rd set removed while editing)
    const { error: deleteError } = await supabase
      .from("match_sets")
      .delete()
      .eq("match_id", match.id)
      .gt("set_number", rows.length);
    if (deleteError) throw deleteError;

    const winnerTeamId = this.resolveWinnerTeamId(rows, config, match);
    const status = winnerTeamId
      ? MATCH_STATUS.COMPLETED
      : rows.length > 0
        ? MATCH_STATUS.IN_PROGRESS
        : MATCH_STATUS.SCHEDULED;

    const { data, error } = await supabase
      .from("matches")
      .update({
        winner_team_id: winnerTeamId,
        status,
        end_time: winnerTeamId
          ? match.end_time || new Date().toISOString()
          : null,
      })
      .eq("id", match.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
