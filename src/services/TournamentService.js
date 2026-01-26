/**
 * Tournament Service
 * Business logic layer for tournament operations
 * Handles tournament lifecycle and match generation
 */

import { supabase } from "../lib/supabase";
import { TOURNAMENT_STATUS, SCORING_TYPES } from "../lib/constants";
import { MatchService } from "./MatchService";

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
          player:players(
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

    // Delete existing teams first
    await this.deleteAllTeams(tournamentId);

    // Shuffle members
    const shuffled = [...members].sort(() => Math.random() - 0.5);

    // Create pairs
    const createdTeams = [];
    let teamIndex = 0;

    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        const teamName = `Team ${String.fromCharCode(65 + teamIndex)}`;
        const team = await this.createTeam(tournamentId, teamName);

        // Add both players to the team
        await this.addTeamMember(team.id, shuffled[i].id);
        await this.addTeamMember(team.id, shuffled[i + 1].id);

        createdTeams.push(team);
        teamIndex++;
      }
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

    // Generate round-robin matches
    const matches = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matches.push({
          tournament_id: tournamentId,
          team_a_id: teams[i].id,
          team_b_id: teams[j].id,
        });
      }
    }

    // Insert all matches
    const { data: createdMatches, error: matchError } = await supabase
      .from("matches")
      .insert(matches)
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
   * Calculate tournament standings
   * @param {string} tournamentId - Tournament ID
   * @returns {Promise<Array>} Sorted standings
   */
  static async calculateStandings(tournamentId) {
    const teams = await this.getTournamentTeams(tournamentId);
    const matches = await MatchService.getMatchesByTournament(tournamentId);

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
}
