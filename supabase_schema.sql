-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PLAYERS (extends auth.users)
create table public.players (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Public profiles are visible, only owner can edit
alter table public.players enable row level security;
create policy "Public profiles are viewable by everyone" on players for select using (true);
create policy "Authenticated users can insert their own profile" on players for insert to authenticated with check (auth.uid() = id);
create policy "Users can update their own profile" on players for update using (auth.uid() = id);

-- 2. GROUPS
create table public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  owner_id uuid references public.players(id) not null,
  image_url text, -- Stored in 'group-images' bucket
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.groups enable row level security;
create policy "Groups are viewable by everyone" on groups for select using (true);
create policy "Authenticated users can create groups" on groups for insert with check (auth.role() = 'authenticated');
create policy "Owners can update groups" on groups for update using (auth.uid() = owner_id);

-- 3. GROUP MEMBERS
create table public.group_members (
  group_id uuid references public.groups(id) on delete cascade not null,
  player_id uuid references public.players(id) on delete cascade not null,
  role text check (role in ('admin', 'member')) default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (group_id, player_id)
);

alter table public.group_members enable row level security;
create policy "Group members are viewable by everyone" on group_members for select using (true);
create policy "Group admins can add members" on group_members for insert with check (
  exists (
    select 1 from groups where id = group_id and owner_id = auth.uid()
  )
);

-- 4. TOURNAMENTS
create type scoring_type_enum as enum ('standard_21', 'single_30', 'custom');

create table public.tournaments (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  name text not null,
  status text check (status in ('draft', 'active', 'completed')) default 'draft',
  scoring_type scoring_type_enum default 'standard_21',
  win_points int default 21,
  max_sets int default 3,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.tournaments enable row level security;
create policy "Tournaments are viewable by everyone" on tournaments for select using (true);
create policy "Group admins can create tournaments" on tournaments for insert with check (
  exists (
    select 1 from groups where id = group_id and owner_id = auth.uid()
  )
);

-- 5. TEAMS
create table public.teams (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references public.tournaments(id) on delete cascade not null,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.teams enable row level security;
create policy "Teams are viewable by everyone" on teams for select using (true);
create policy "Tournament organizers can manage teams" on teams for all using (
  exists (
    select 1 from tournaments t
    join groups g on t.group_id = g.id
    where t.id = tournament_id and g.owner_id = auth.uid()
  )
);

-- 6. TEAM MEMBERS
create table public.team_members (
  team_id uuid references public.teams(id) on delete cascade not null,
  player_id uuid references public.players(id) on delete cascade not null,
  primary key (team_id, player_id)
);

alter table public.team_members enable row level security;
create policy "Team members are viewable by everyone" on team_members for select using (true);

-- 7. MATCHES
create table public.matches (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references public.tournaments(id) on delete cascade not null,
  team_a_id uuid references public.teams(id) not null,
  team_b_id uuid references public.teams(id) not null,
  winner_team_id uuid references public.teams(id),
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.matches enable row level security;
create policy "Matches are viewable by everyone" on matches for select using (true);
-- Organizers can edit matches
create policy "Organizers can  matches" on matches for all using (
  exists (
    select 1 from tournaments t
    join groups g on t.group_id = g.id
    where t.id = tournament_id and g.owner_id = auth.uid()
  )
);

-- 8. MATCH SETS
create table public.match_sets (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches(id) on delete cascade not null,
  set_number int not null,
  score_team_a int default 0,
  score_team_b int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (match_id, set_number)
);

alter table public.match_sets enable row level security;
create policy "Match sets are viewable by everyone" on match_sets for select using (true);
-- Organizers can edit sets
create policy "Organizers can edit sets" on match_sets for all using (
  exists (
    select 1 from matches m
    join tournaments t on m.tournament_id = t.id
    join groups g on t.group_id = g.id
    where m.id = match_id and g.owner_id = auth.uid()
  )
);

-- STORAGE BUCKETS (To be created in UI, but listed here for ref)
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- insert into storage.buckets (id, name, public) values ('group-images', 'group-images', true);
