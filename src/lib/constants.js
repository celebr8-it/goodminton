/**
 * Application Constants
 * Centralized configuration values
 */

// Tournament Scoring Types
export const SCORING_TYPES = {
  STANDARD_21: "standard_21",
  SINGLE_21: "single_21",
  SINGLE_30: "single_30",
  CUSTOM: "custom",
};

export const SCORING_TYPE_LABELS = {
  [SCORING_TYPES.STANDARD_21]: "Standard (Best of 3 to 21)",
  [SCORING_TYPES.SINGLE_21]: "Single Set (21 points)",
  [SCORING_TYPES.SINGLE_30]: "Single Set (30 points)",
  [SCORING_TYPES.CUSTOM]: "Custom Scoring",
};

// Tournament Status
export const TOURNAMENT_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  COMPLETED: "completed",
};

export const TOURNAMENT_STATUS_LABELS = {
  [TOURNAMENT_STATUS.DRAFT]: "Draft",
  [TOURNAMENT_STATUS.ACTIVE]: "In Progress",
  [TOURNAMENT_STATUS.COMPLETED]: "Completed",
};

// Group Member Roles
export const MEMBER_ROLES = {
  ADMIN: "admin",
  MEMBER: "member",
};

// Match Status
export const MATCH_STATUS = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

// Team Types
export const TEAM_TYPES = {
  SINGLES: 1, // 1 player
  DOUBLES: 2, // 2 players
};

// Default Values
export const DEFAULTS = {
  WIN_POINTS: 21,
  MAX_SETS: 3,
  SINGLE_SET_POINTS: 30,
  DEUCE_LEAD: 2, // Points ahead needed to win at deuce
};

// Validation Rules
export const VALIDATION = {
  MIN_GROUP_NAME_LENGTH: 2,
  MAX_GROUP_NAME_LENGTH: 50,
  MIN_TOURNAMENT_NAME_LENGTH: 3,
  MAX_TOURNAMENT_NAME_LENGTH: 100,
  MIN_PASSWORD_LENGTH: 6,
  MIN_TEAMS_FOR_TOURNAMENT: 2,
  MIN_PLAYERS_FOR_RANDOM_TEAMS: 4,
};

// Supabase Storage Buckets
export const STORAGE_BUCKETS = {
  AVATARS: "avatars",
  GROUP_IMAGES: "group-images",
};

// Route Paths
export const ROUTES = {
  HOME: "/home",
  LANDING: "/",
  AUTH: "/auth",
  GROUPS: "/groups",
  GROUP_DETAIL: "/groups/:groupId",
  CREATE_TOURNAMENT: "/groups/:groupId/create-tournament",
  TOURNAMENTS: "/tournaments",
  TOURNAMENT_DETAIL: "/tournaments/:tournamentId",
  MATCH_DETAIL: "/matches/:matchId",
};

// Build route with params
export const buildRoute = (template, params) => {
  let route = template;
  Object.entries(params).forEach(([key, value]) => {
    route = route.replace(`:${key}`, value);
  });
  return route;
};
