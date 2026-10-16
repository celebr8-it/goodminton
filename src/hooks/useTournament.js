/**
 * Tournament Hook
 * Custom React hook for tournament state management
 * Encapsulates tournament logic and side effects
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { TournamentService, MATCH_STAGE } from "../services/TournamentService";
import { MatchService } from "../services/MatchService";
import { TOURNAMENT_STATUS } from "../lib/constants";

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
   * Fetch all tournament data. Only the first load shows the full-page spinner,
   * later refreshes update in place.
   */
  const fetchTournamentData = useCallback(async () => {
    if (!tournamentId) return;

    try {
      setError(null);

      let [tournamentData, teamsData, matchesData] = await Promise.all([
        TournamentService.getTournamentById(tournamentId),
        TournamentService.getTournamentTeams(tournamentId),
        MatchService.getMatchesByTournament(tournamentId),
      ]);

      // Self-heal the bracket in case a result was saved by someone
      // who couldn't create the next round
      if (matchesData.some((m) => m.stage === MATCH_STAGE.PLAYOFF)) {
        try {
          const { changed } = await TournamentService.syncPlayoffs(tournamentId);
          if (changed) {
            [tournamentData, matchesData] = await Promise.all([
              TournamentService.getTournamentById(tournamentId),
              MatchService.getMatchesByTournament(tournamentId),
            ]);
          }
        } catch (syncErr) {
          console.error("Error syncing playoffs:", syncErr);
        }
      }

      setTournament(tournamentData);
      setTeams(teamsData);
      setMatches(matchesData);

      if (tournamentData.status !== TOURNAMENT_STATUS.DRAFT) {
        const standingsData = await TournamentService.calculateStandings(
          tournamentId,
          { teams: teamsData, matches: matchesData }
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
   * Wrap an action with loading state and a data refresh
   */
  const runAction = useCallback(
    async (action) => {
      try {
        setActionLoading(true);
        setError(null);
        const result = await action();
        await fetchTournamentData();
        return result;
      } catch (err) {
        console.error("Tournament action failed:", err);
        setError(err.message);
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchTournamentData]
  );

  const startTournament = useCallback(
    () => runAction(() => TournamentService.startTournament(tournamentId)),
    [runAction, tournamentId]
  );

  const completeTournament = useCallback(
    () => runAction(() => TournamentService.completeTournament(tournamentId)),
    [runAction, tournamentId]
  );

  const startPlayoffs = useCallback(
    (size) =>
      runAction(() => TournamentService.generatePlayoffs(tournamentId, size)),
    [runAction, tournamentId]
  );

  /**
   * Derived phase info used to drive the UI
   */
  const phase = useMemo(() => {
    const leagueMatches = matches.filter((m) => m.stage !== MATCH_STAGE.PLAYOFF);
    const playoffMatches = matches.filter((m) => m.stage === MATCH_STAGE.PLAYOFF);
    const leagueDone = leagueMatches.filter((m) => m.winner_team_id).length;
    const final = playoffMatches.find((m) => m.round_size === 2);
    const currentRound = playoffMatches.length
      ? Math.min(...playoffMatches.map((m) => m.round_size))
      : null;

    return {
      leagueMatches,
      playoffMatches,
      leagueTotal: leagueMatches.length,
      leagueDone,
      leaguePending: leagueMatches.length - leagueDone,
      leagueComplete:
        leagueMatches.length > 0 && leagueDone === leagueMatches.length,
      hasPlayoffs: playoffMatches.length > 0,
      currentRound,
      championTeamId: final?.winner_team_id || null,
      seeds: TournamentService.getPlayoffSeeds(matches),
    };
  }, [matches]);

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
    setLoading(true);
    fetchTournamentData();
  }, [fetchTournamentData]);

  // Pick up results entered on other phones when coming back to this tab
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchTournamentData();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchTournamentData]);

  return {
    tournament,
    teams,
    matches,
    standings,
    phase,
    loading,
    error,
    actionLoading,
    startTournament,
    completeTournament,
    startPlayoffs,
    getStatistics,
    refetch: fetchTournamentData,
  };
}
