-- Migration: League → Playoffs support + stable match ordering
-- Run once in the Supabase SQL editor before using "Start playoffs".

-- 1. Which phase a match belongs to
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'league';

ALTER TABLE public.matches
  DROP CONSTRAINT IF EXISTS matches_stage_check;
ALTER TABLE public.matches
  ADD CONSTRAINT matches_stage_check CHECK (stage IN ('league', 'playoff'));

-- 2. Bracket position for playoff matches
--    round_size  = number of teams in that round (8 = quarter-final, 4 = semi-final, 2 = final)
--    bracket_slot = 0-based position inside the round; winners of slots 2k and 2k+1 meet in slot k of the next round
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS round_size int;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS bracket_slot int;

-- Prevents two phones generating the same bracket match twice
CREATE UNIQUE INDEX IF NOT EXISTS matches_playoff_slot_unique
  ON public.matches (tournament_id, round_size, bracket_slot)
  WHERE stage = 'playoff';

-- 3. Play order for league fixtures (bulk inserts share the same created_at)
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS match_order int;

COMMENT ON COLUMN public.matches.stage IS 'league (round robin) or playoff (knockout)';
COMMENT ON COLUMN public.matches.round_size IS 'Playoff only: teams in the round (8=QF, 4=SF, 2=Final)';
COMMENT ON COLUMN public.matches.bracket_slot IS 'Playoff only: 0-based slot within the round';
COMMENT ON COLUMN public.matches.match_order IS 'Suggested play order within the tournament';
