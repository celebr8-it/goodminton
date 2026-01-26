# Goodminton - Product Requirements Document (MVP)

## 1. Executive Summary
Goodminton is a web application designed to simplify the management of amateur badminton tournaments. It replaces manual tracking with a modern UI, supporting flexible match formats and user groups.

## 2. Product Scope (MVP)
1.  **Group Management:** Users can join multiple groups via email invites or codes.
2.  **Tournament Management:** Organizers create events and generate teams.
3.  **Match Tracking:** Flexible scoring for various formats (Standard, 1-Set, etc.).

## 3. Tech Stack
- **Frontend:** React + Vite + Tailwind CSS + Framer Motion.
- **Backend/DB:** Supabase (Auth, Database, Realtime).

## 4. Functional Requirements

### 4.1 User & Group Management
- **Authentication:** Sign up/Login via Email (Supabase Auth).
- **Groups:**
    - Users can own/create groups.
    - Users can join multiple specific groups (Many-to-Many relationship).
    - **Group Image:** Groups will have a display picture (stored in Supabase Storage).
    - Invite members via email lookup (if they exist) or simple "Join Code" for ease.

### 4.2 Tournament & Teams
- **Generation:**
    - **Architect choice**: **Normalized Teams**. A team is a separate entity linked to flexible members.
    - Supports Singles (1 player), Doubles (2 players), or future mixed sizes.
    - Randomizer logic remains core.

### 4.3 Match Recording
- **Flexible Scoring:**
    - Instead of fixed columns, we use a `Sets` relation.
    - Supports: Best of 3, Single set to 30, etc.
- **Deuce/Draws:**
    - Standard badminton has no draws, but we will allow the system to accept input as is.
    - Logic to validate scores (e.g. check for >= 2 point lead).

## 5. Data Model (Schema)

**players** (Extends Supabase Auth - These are the "Profiles")
- id (uuid, PK)
- email
- full_name
- avatar_url (Stored in 'avatars' bucket)

**groups**
- id (uuid, PK)
- name
- owner_id (FK -> players.id)
- image_url (Stored in 'group-images' bucket)

**group_members**
- group_id (FK)
- player_id (FK -> players.id)
- role (admin, member)

**tournaments**
- id (uuid, PK)
- group_id (FK)
- name
- status (draft, active, completed)
- scoring_type (enum: 'standard_21', 'single_30', 'custom') -> "TypeEnum"
- win_points (int, default: 21)
- max_sets (int, default: 3)

**teams**
- id (uuid, PK)
- tournament_id (FK)
- name (optional, e.g., "Team A")

**team_members**
- team_id (FK)
- player_id (FK -> players.id)

**matches**
- id (uuid, PK)
- tournament_id (FK)
- team_a_id (FK -> teams)
- team_b_id (FK -> teams)
- start_time
- end_time
- winner_team_id (FK -> teams, nullable)

**match_sets**
- id (uuid, PK)
- match_id (FK)
- set_number (int)
- score_team_a (int)
- score_team_b (int)

## 6. Implementation Strategy
We will implement this "Scalable" schema but use Supabase JS helpers to keep development fast. We will prioritize the "Happy Path" (create group -> create tourney -> play) to finish by evening.
