-- OPTIONAL migration: let any member of a group record/edit tournament scores.
-- Without this only the group owner can save scores (existing RLS).
-- Run it if players enter their own scores from their phones at the court.

DROP POLICY IF EXISTS "Group members can update tournament matches" ON public.matches;
CREATE POLICY "Group members can update tournament matches"
ON public.matches FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tournaments t
    JOIN group_members gm ON gm.group_id = t.group_id
    WHERE t.id = matches.tournament_id AND gm.player_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = matches.group_id AND gm.player_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Group members can record sets" ON public.match_sets;
CREATE POLICY "Group members can record sets"
ON public.match_sets FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM matches m
    LEFT JOIN tournaments t ON t.id = m.tournament_id
    JOIN group_members gm ON gm.group_id = COALESCE(t.group_id, m.group_id)
    WHERE m.id = match_sets.match_id AND gm.player_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM matches m
    LEFT JOIN tournaments t ON t.id = m.tournament_id
    JOIN group_members gm ON gm.group_id = COALESCE(t.group_id, m.group_id)
    WHERE m.id = match_sets.match_id AND gm.player_id = auth.uid()
  )
);

-- Saving a playoff result creates/updates the next bracket match and marks the
-- tournament complete after the final, so members need these too.
DROP POLICY IF EXISTS "Group members can manage playoff matches" ON public.matches;
CREATE POLICY "Group members can manage playoff matches"
ON public.matches FOR ALL TO authenticated
USING (
  stage = 'playoff' AND EXISTS (
    SELECT 1 FROM tournaments t
    JOIN group_members gm ON gm.group_id = t.group_id
    WHERE t.id = matches.tournament_id AND gm.player_id = auth.uid()
  )
)
WITH CHECK (
  stage = 'playoff' AND EXISTS (
    SELECT 1 FROM tournaments t
    JOIN group_members gm ON gm.group_id = t.group_id
    WHERE t.id = matches.tournament_id AND gm.player_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Group members can update tournament status" ON public.tournaments;
CREATE POLICY "Group members can update tournament status"
ON public.tournaments FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = tournaments.group_id AND gm.player_id = auth.uid()
  )
);
