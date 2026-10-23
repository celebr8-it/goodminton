/**
 * Group Service
 * Handles all group-related business logic
 */

import { supabase } from "../lib/supabase";
import { SCORING_TYPES } from "../lib/constants";
import { customFormatColumns, explainMissingFormatColumns } from "../lib/scoringFormat";

export class GroupService {
  /**
   * Get all groups for a user
   */
  static async getUserGroups(userId) {
    const { data, error } = await supabase
      .from("group_members")
      .select(
        `
        role,
        groups (
          id,
          name,
          image_url,
          owner_id
        )
      `
      )
      .eq("player_id", userId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get group by ID with members
   */
  static async getGroupById(groupId) {
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get group members
   */
  static async getGroupMembers(groupId) {
    const { data, error } = await supabase
      .from("group_members")
      .select(
        `
        role,
        players (
          id,
          full_name,
          email,
          avatar_url
        )
      `
      )
      .eq("group_id", groupId);

    if (error) throw error;
    return data?.map((m) => ({ ...m.players, role: m.role })) || [];
  }

  /**
   * Get group tournaments
   */
  static async getGroupTournaments(groupId) {
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get group matches (including standalone matches)
   */
  static async getGroupMatches(groupId) {
    const { data, error } = await supabase
      .from("matches")
      .select(
        `
        *,
        match_sets(*),
        team_a:teams!matches_team_a_id_fkey(
          *,
          team_members(
            players(id, full_name, email)
          )
        ),
        team_b:teams!matches_team_b_id_fkey(
          *,
          team_members(
            players(id, full_name, email)
          )
        ),
        tournament:tournaments(*)
      `
      )
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new group
   */
  static async createGroup(userId, groupName) {
    // Create group
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert([{ name: groupName, owner_id: userId }])
      .select()
      .single();

    if (groupError) throw groupError;

    // Add creator as admin
    const { error: memberError } = await supabase
      .from("group_members")
      .insert([{ group_id: group.id, player_id: userId, role: "admin" }]);

    if (memberError) throw memberError;

    return group;
  }

  /**
   * Add member to group via invite code
   */
  static async joinGroupByInviteCode(userId, inviteCode) {
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id")
      .eq("invite_code", inviteCode)
      .single();

    if (groupError) throw new Error("Invalid invite code");

    // Check if already a member
    const { data: existing } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", group.id)
      .eq("player_id", userId)
      .single();

    if (existing) {
      throw new Error("You are already a member of this group");
    }

    // Add member
    const { error: memberError } = await supabase
      .from("group_members")
      .insert([{ group_id: group.id, player_id: userId, role: "member" }]);

    if (memberError) throw memberError;

    return group;
  }

  /**
   * Remove member from group
   */
  static async removeMember(groupId, playerId) {
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("player_id", playerId);

    if (error) throw error;
  }

  /**
   * Create standalone match (not part of tournament)
   */
  static async createStandaloneMatch({
    groupId,
    teamAId,
    teamBId,
    scoringType = "standard_21",
    custom,
  }) {
    const { data, error } = await supabase
      .from("matches")
      .insert([
        {
          group_id: groupId,
          team_a_id: teamAId,
          team_b_id: teamBId,
          tournament_id: null, // No tournament
          status: "scheduled",
          scoring_type: scoringType,
          // Presets are implied by scoring_type; only custom needs the extra columns
          ...(scoringType === SCORING_TYPES.CUSTOM ? customFormatColumns(custom) : {}),
        },
      ])
      .select()
      .single();

    if (error) throw explainMissingFormatColumns(error);
    return data;
  }

  /**
   * Delete a group (owner only)
   * @param {string} groupId - Group ID
   * @returns {Promise<void>}
   */
  static async deleteGroup(groupId) {
    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId);

    if (error) throw error;
  }

  /**
   * Check if user is group owner
   * @param {string} groupId - Group ID  
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  static async isGroupOwner(groupId, userId) {
    const { data, error } = await supabase
      .from("groups")
      .select("owner_id")
      .eq("id", groupId)
      .single();

    if (error) return false;
    return data?.owner_id === userId;
  }
}
