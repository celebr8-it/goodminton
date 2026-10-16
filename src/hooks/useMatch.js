/**
 * Match Hook
 * Custom React hook for match state management
 * Encapsulates match logic and side effects
 */

import { useState, useEffect, useCallback } from "react";
import { MatchService } from "../services/MatchService";
import { TournamentService, MATCH_STAGE } from "../services/TournamentService";

/**
 * Custom hook for managing match state and operations
 * @param {string} matchId - Match ID
 * @returns {Object} Match state and operations
 */
export function useMatch(matchId) {
  const [match, setMatch] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [nextMatch, setNextMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  /**
   * Fetch match data. Only the first load shows the full-page spinner.
   */
  const fetchMatch = useCallback(async () => {
    if (!matchId) return;

    try {
      setError(null);

      const matchData = await MatchService.getMatchById(matchId);
      setMatch(matchData);
      setTournament(matchData.tournament || null);

      if (matchData.tournament_id) {
        const next = await MatchService.getNextPendingMatch(
          matchData.tournament_id,
          matchData.id
        );
        setNextMatch(next);
      } else {
        setNextMatch(null);
      }
    } catch (err) {
      console.error("Error fetching match:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  /**
   * Save all set scores at once. The match completes automatically
   * as soon as the sets decide a winner.
   * @param {Array<{a:number, b:number}>} sets - Set scores in order
   */
  const saveResult = useCallback(
    async (sets) => {
      if (!match) return;

      try {
        setSaving(true);
        setError(null);

        const isPlayoff = match.stage === MATCH_STAGE.PLAYOFF;
        if (isPlayoff) {
          const newWinner = MatchService.resolveWinnerTeamId(
            sets.map((s, i) => ({
              set_number: i + 1,
              score_team_a: s.a,
              score_team_b: s.b,
            })),
            tournament,
            match
          );
          await TournamentService.assertPlayoffEditable(match, newWinner);
        }

        await MatchService.saveMatchResult({ match, sets, config: tournament });

        if (isPlayoff && match.tournament_id) {
          try {
            await TournamentService.syncPlayoffs(match.tournament_id);
          } catch (syncErr) {
            // The result itself is saved; the tournament page re-syncs the bracket on load
            console.error("Error advancing playoffs:", syncErr);
          }
        }

        await fetchMatch();
      } catch (err) {
        console.error("Error saving result:", err);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [match, tournament, fetchMatch]
  );

  /**
   * Calculate current winner
   */
  const calculateWinner = useCallback(() => {
    if (!match || !tournament) return null;
    return MatchService.calculateMatchWinner(match.match_sets, tournament);
  }, [match, tournament]);

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    fetchMatch();
  }, [fetchMatch]);

  return {
    match,
    tournament,
    nextMatch,
    loading,
    error,
    saving,
    saveResult,
    calculateWinner,
    refetch: fetchMatch,
  };
}
