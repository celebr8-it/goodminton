/**
 * Tournament Hook
 * Custom React hook for tournament state management
 * Encapsulates tournament logic and side effects
 */

import { useState, useEffect, useCallback } from "react";
import { TournamentService } from "../services/TournamentService";
import { MatchService } from "../services/MatchService";

/**
 * Custom hook for managing tournament state and operations
 * @param {string} tournamentId - Tournament ID
 * @returns {Object} Tournament state and operations
 */
export function useTournament(tournamentId) {
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  /**
   * Fetch all tournament data
   */
  const fetchTournamentData = useCallback(async () => {
    if (!tournamentId) return;

    try {
      setLoading(true);
      setError(null);

      const [tournamentData, teamsData, matchesData] = await Promise.all([
        TournamentService.getTournamentById(tournamentId),
        TournamentService.getTournamentTeams(tournamentId),
        MatchService.getMatchesByTournament(tournamentId),
      ]);

      setTournament(tournamentData);
      setTeams(teamsData);
      setMatches(matchesData);

      // Calculate standings if tournament is active
      if (
        tournamentData.status === "active" ||
        tournamentData.status === "completed"
      ) {
        const standingsData = await TournamentService.calculateStandings(
          tournamentId
        );
        setStandings(standingsData);
      }
    } catch (err) {
      console.error("Error fetching tournament:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  /**
   * Start tournament
   */
  const startTournament = useCallback(async () => {
    try {
      setActionLoading(true);
      setError(null);

      const result = await TournamentService.startTournament(tournamentId);

      // Refresh data
      await fetchTournamentData();

      return result;
    } catch (err) {
      console.error("Error starting tournament:", err);
      setError(err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [tournamentId, fetchTournamentData]);

  /**
   * Complete tournament
   */
  const completeTournament = useCallback(async () => {
    try {
      setActionLoading(true);
      setError(null);

      await TournamentService.completeTournament(tournamentId);

      // Refresh data
      await fetchTournamentData();
    } catch (err) {
      console.error("Error completing tournament:", err);
      setError(err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [tournamentId, fetchTournamentData]);

  /**
   * Get tournament statistics
   */
  const getStatistics = useCallback(() => {
    const totalMatches = matches.length;
    const completedMatches = matches.filter((m) => m.winner_team_id).length;
    const pendingMatches = totalMatches - completedMatches;
    const completionPercentage =
      totalMatches > 0
        ? Math.round((completedMatches / totalMatches) * 100)
        : 0;

    return {
      totalMatches,
      completedMatches,
      pendingMatches,
      completionPercentage,
      totalTeams: teams.length,
    };
  }, [matches, teams]);

  // Initial fetch
  useEffect(() => {
    fetchTournamentData();
  }, [fetchTournamentData]);

  return {
    tournament,
    teams,
    matches,
    standings,
    loading,
    error,
    actionLoading,
    startTournament,
    completeTournament,
    getStatistics,
    refetch: fetchTournamentData,
  };
}
