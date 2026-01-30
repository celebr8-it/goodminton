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
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
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
   * Validate set score based on tournament rules
   * @param {number} scoreA - Team A score
   * @param {number} scoreB - Team B score
   * @param {Object} tournament - Tournament configuration
   * @returns {Object} Validation result
   */
  static validateSetScore(scoreA, scoreB, tournament) {
    const winPoints = tournament.win_points || 21;
    const minLead = 2;

    const errors = [];

    // Both scores can't be zero (unless just started)
    if (scoreA === 0 && scoreB === 0) {
      errors.push("Set score cannot be 0-0");
    }

    // At least one must reach win points or be ahead by 2
    const maxScore = Math.max(scoreA, scoreB);
    const minScore = Math.min(scoreA, scoreB);
    const lead = maxScore - minScore;

    if (maxScore >= winPoints) {
      if (lead < minLead && maxScore < 30) {
        errors.push(`Must win by ${minLead} points or reach 30`);
      }
    } else {
      errors.push(`At least one team must reach ${winPoints} points`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
