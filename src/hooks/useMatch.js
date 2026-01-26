/**
 * Match Hook
 * Custom React hook for match state management
 * Encapsulates match logic and side effects
 */

import { useState, useEffect, useCallback } from "react";
import { MatchService } from "../services/MatchService";
import { TournamentService } from "../services/TournamentService";

/**
 * Custom hook for managing match state and operations
 * @param {string} matchId - Match ID
 * @returns {Object} Match state and operations
 */
export function useMatch(matchId) {
  const [match, setMatch] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  /**
   * Fetch match data
   */
  const fetchMatch = useCallback(async () => {
    if (!matchId) return;

    try {
      setLoading(true);
      setError(null);

      const matchData = await MatchService.getMatchById(matchId);
      setMatch(matchData);

      if (matchData.tournament) {
        setTournament(matchData.tournament);
      }
    } catch (err) {
      console.error("Error fetching match:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  /**
   * Record a set score
   */
  const recordSetScore = useCallback(
    async (setNumber, scoreTeamA, scoreTeamB) => {
      try {
        setSaving(true);
        setError(null);

        await MatchService.recordSetScore({
          matchId,
          setNumber,
          scoreTeamA,
          scoreTeamB,
        });

        // Refresh match data
        await fetchMatch();
      } catch (err) {
        console.error("Error recording set score:", err);
        setError(err.message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [matchId, fetchMatch]
  );

  /**
   * Complete match with winner
   */
  const completeMatch = useCallback(
    async (winnerTeamId) => {
      try {
        setSaving(true);
        setError(null);

        await MatchService.completeMatch({
          matchId,
          winnerTeamId,
        });

        // Refresh match data
        await fetchMatch();
      } catch (err) {
        console.error("Error completing match:", err);
        setError(err.message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [matchId, fetchMatch]
  );

  /**
   * Start match
   */
  const startMatch = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);

      await MatchService.startMatch(matchId);

      // Refresh match data
      await fetchMatch();
    } catch (err) {
      console.error("Error starting match:", err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [matchId, fetchMatch]);

  /**
   * Delete a set
   */
  const deleteSet = useCallback(
    async (setNumber) => {
      try {
        setSaving(true);
        setError(null);

        await MatchService.deleteSet(matchId, setNumber);

        // Refresh match data
        await fetchMatch();
      } catch (err) {
        console.error("Error deleting set:", err);
        setError(err.message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [matchId, fetchMatch]
  );

  /**
   * Calculate current winner
   */
  const calculateWinner = useCallback(() => {
    if (!match || !tournament) return null;
    return MatchService.calculateMatchWinner(match.match_sets, tournament);
  }, [match, tournament]);

  /**
   * Validate set score
   */
  const validateSetScore = useCallback(
    (scoreA, scoreB) => {
      if (!tournament)
        return { isValid: false, errors: ["Tournament not loaded"] };
      return MatchService.validateSetScore(scoreA, scoreB, tournament);
    },
    [tournament]
  );

  // Initial fetch
  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  return {
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
    validateSetScore,
    refetch: fetchMatch,
  };
}
