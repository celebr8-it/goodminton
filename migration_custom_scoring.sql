-- Migration: custom scoring formats
-- Run once in the Supabase SQL editor before creating a tournament or match with "Custom" scoring.

-- Tournaments already have win_points / max_sets; add deuce rules
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS deuce boolean NOT NULL DEFAULT true;
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS point_cap int;

-- Standalone matches store their own format
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS win_points int;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS max_sets int;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS deuce boolean;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS point_cap int;

COMMENT ON COLUMN public.tournaments.deuce IS 'Custom scoring: at (win_points-1)-all a 2-point lead is needed';
COMMENT ON COLUMN public.tournaments.point_cap IS 'Custom scoring: highest possible set score when deuce is on';
COMMENT ON COLUMN public.matches.win_points IS 'Standalone custom scoring: points to win a set';
COMMENT ON COLUMN public.matches.max_sets IS 'Standalone custom scoring: 1, 3 or 5 sets';
