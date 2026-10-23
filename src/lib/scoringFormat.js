/**
 * Scoring formats
 * Single source of truth for how a match is scored: number of sets, points to
 * win a set, deuce (win by 2) and the deuce cap. Everything that validates,
 * auto-fills or explains scores reads from resolveFormat().
 */

import { SCORING_TYPES } from "./constants";

export const SET_OPTIONS = [1, 3, 5];
export const POINT_PRESETS = [11, 15, 21, 25, 30];
export const MIN_POINTS = 5;
export const MAX_POINTS = 50;
// Score boxes take two digits
export const MAX_CAP = 99;

/**
 * Sensible deuce cap for a target, following BWF-style ratios:
 * 21 → 30, 15 → 21, 11 → 15
 */
export const defaultCap = (winPoints) => winPoints + Math.floor((winPoints * 3) / 7);

const PRESETS = {
  [SCORING_TYPES.STANDARD_21]: { maxSets: 3, winPoints: 21, deuce: true, cap: 30 },
  [SCORING_TYPES.SINGLE_21]: { maxSets: 1, winPoints: 21, deuce: true, cap: 30 },
  [SCORING_TYPES.SINGLE_30]: { maxSets: 1, winPoints: 30, deuce: false, cap: 30 },
};

const clampInt = (value, min, max, fallback) => {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
};

/**
 * Resolve the scoring rules for a tournament, or a standalone match's synthesized config.
 * @param {Object} config - Row with scoring_type and, for custom, win_points / max_sets / deuce / point_cap
 * @returns {{scoringType, maxSets, setsToWin, winPoints, deuce, cap, isCustom}}
 */
export function resolveFormat(config) {
  const scoringType = config?.scoring_type || SCORING_TYPES.STANDARD_21;
  const preset = PRESETS[scoringType];

  let format;
  if (preset) {
    format = { ...preset };
  } else {
    const winPoints = clampInt(config?.win_points, MIN_POINTS, MAX_POINTS, 21);
    const maxSets = SET_OPTIONS.includes(Number(config?.max_sets)) ? Number(config.max_sets) : 1;
    const deuce = config?.deuce !== false;
    const cap = deuce
      ? clampInt(config?.point_cap, winPoints + 1, MAX_CAP, Math.min(defaultCap(winPoints), MAX_CAP))
      : winPoints;
    format = { maxSets, winPoints, deuce, cap };
  }

  return {
    ...format,
    scoringType,
    isCustom: !preset,
    setsToWin: Math.ceil(format.maxSets / 2),
  };
}

/** "Best of 3 · 21 pts" / "1 set · 15 pts" */
export function formatShortLabel(config) {
  const f = resolveFormat(config);
  const sets = f.maxSets === 1 ? "1 set" : `Best of ${f.maxSets}`;
  return `${sets} · ${f.winPoints} pts`;
}

/** One-line rule for a single set, e.g. "First to 15, win by 2 from 14-all, max 21" */
export function describeSetRule(config) {
  const f = resolveFormat(config);
  if (!f.deuce || f.cap <= f.winPoints) return `First to ${f.winPoints}, no deuce`;
  return `First to ${f.winPoints}, win by 2 from ${f.winPoints - 1}-all, max ${f.cap}`;
}

/** Full description for forms and headers */
export function describeFormat(config) {
  const f = resolveFormat(config);
  const sets =
    f.maxSets === 1
      ? "One set."
      : `Best of ${f.maxSets}: first team to win ${f.setsToWin} sets takes the match.`;
  return `${sets} ${describeSetRule(config)}.`;
}

/**
 * Turn a custom form value into DB columns
 * @param {{winPoints, maxSets, deuce, cap}} custom
 */
export function customFormatColumns(custom) {
  const winPoints = clampInt(custom.winPoints, MIN_POINTS, MAX_POINTS, 21);
  const deuce = !!custom.deuce;
  return {
    win_points: winPoints,
    max_sets: SET_OPTIONS.includes(custom.maxSets) ? custom.maxSets : 1,
    deuce,
    point_cap: deuce ? clampInt(custom.cap, winPoints + 1, MAX_CAP, defaultCap(winPoints)) : winPoints,
  };
}

/** DB columns for any chosen format (presets mirror their rules into win_points / max_sets) */
export function formatColumns(scoringType, custom) {
  if (scoringType === SCORING_TYPES.CUSTOM) return customFormatColumns(custom);
  const preset = PRESETS[scoringType] || PRESETS[SCORING_TYPES.STANDARD_21];
  return { win_points: preset.winPoints, max_sets: preset.maxSets };
}

/** Custom scoring needs extra columns; point at the migration if they're missing */
export const explainMissingFormatColumns = (error) =>
  error?.code === "PGRST204" || error?.code === "42703"
    ? new Error("Custom scoring needs a database update. Run migration_custom_scoring.sql in Supabase.")
    : error;

/** Initial value for the format picker (custom defaults to a single set) */
export const DEFAULT_FORMAT = {
  scoringType: SCORING_TYPES.STANDARD_21,
  custom: { winPoints: 21, maxSets: 1, deuce: true, cap: 30, capEdited: false },
};

/** Format picker value → config shape understood by resolveFormat() */
export const pickerToConfig = (value) => ({
  scoring_type: value.scoringType,
  win_points: value.custom.winPoints,
  max_sets: value.custom.maxSets,
  deuce: value.custom.deuce,
  point_cap: value.custom.cap,
});
