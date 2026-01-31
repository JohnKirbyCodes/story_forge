-- ============================================================================
-- STORYFORGE COMBINED MIGRATIONS
-- Run this in Supabase SQL Editor: Dashboard -> SQL Editor -> New Query
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: INITIAL SCHEMA
-- ============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text default 'free' check (subscription_status in ('free', 'pro', 'canceled')),
  subscription_period_end timestamptz,
  words_generated_this_month integer default 0,
  words_quota integer default 5000,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own profile' AND tablename = 'profiles') THEN
    create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile' AND tablename = 'profiles') THEN
    create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
  END IF;
END $$;

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- PROJECTS TABLE
create table if not exists public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  genre text,
  cover_image_url text,
  world_setting text,
  time_period text,
  themes text[],
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.projects enable row level security;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own projects' AND tablename = 'projects') THEN
    create policy "Users can view own projects" on public.projects for select using (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create own projects' AND tablename = 'projects') THEN
    create policy "Users can create own projects" on public.projects for insert with check (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own projects' AND tablename = 'projects') THEN
    create policy "Users can update own projects" on public.projects for update using (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own projects' AND tablename = 'projects') THEN
    create policy "Users can delete own projects" on public.projects for delete using (auth.uid() = user_id);
  END IF;
END $$;

-- BOOKS TABLE
create table if not exists public.books (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  subtitle text,
  description text,
  cover_image_url text,
  target_word_count integer,
  current_word_count integer default 0,
  status text default 'draft' check (status in ('draft', 'in_progress', 'complete', 'published')),
  sort_order integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.books enable row level security;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own books' AND tablename = 'books') THEN
    create policy "Users can view own books" on public.books for select
    using (exists (select 1 from public.projects where projects.id = books.project_id and projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create books in own projects' AND tablename = 'books') THEN
    create policy "Users can create books in own projects" on public.books for insert
    with check (exists (select 1 from public.projects where projects.id = project_id and projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own books' AND tablename = 'books') THEN
    create policy "Users can update own books" on public.books for update
    using (exists (select 1 from public.projects where projects.id = books.project_id and projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own books' AND tablename = 'books') THEN
    create policy "Users can delete own books" on public.books for delete
    using (exists (select 1 from public.projects where projects.id = books.project_id and projects.user_id = auth.uid()));
  END IF;
END $$;

-- CHAPTERS TABLE
create table if not exists public.chapters (
  id uuid default uuid_generate_v4() primary key,
  book_id uuid references public.books(id) on delete cascade not null,
  title text not null,
  summary text,
  part_number integer,
  part_title text,
  sort_order integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.chapters enable row level security;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own chapters' AND tablename = 'chapters') THEN
    create policy "Users can view own chapters" on public.chapters for select
    using (exists (select 1 from public.books join public.projects on projects.id = books.project_id where books.id = chapters.book_id and projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create chapters in own books' AND tablename = 'chapters') THEN
    create policy "Users can create chapters in own books" on public.chapters for insert
    with check (exists (select 1 from public.books join public.projects on projects.id = books.project_id where books.id = book_id and projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own chapters' AND tablename = 'chapters') THEN
    create policy "Users can update own chapters" on public.chapters for update
    using (exists (select 1 from public.books join public.projects on projects.id = books.project_id where books.id = chapters.book_id and projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own chapters' AND tablename = 'chapters') THEN
    create policy "Users can delete own chapters" on public.chapters for delete
    using (exists (select 1 from public.books join public.projects on projects.id = books.project_id where books.id = chapters.book_id and projects.user_id = auth.uid()));
  END IF;
END $$;

-- SCENES TABLE
create table if not exists public.scenes (
  id uuid default uuid_generate_v4() primary key,
  chapter_id uuid references public.chapters(id) on delete cascade not null,
  title text,
  beat_instructions text,
  generated_prose text,
  edited_prose text,
  location_id uuid,
  time_in_story text,
  pov_character_id uuid,
  word_count integer default 0,
  sort_order integer default 0,
  last_generated_at timestamptz,
  generation_model text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.scenes enable row level security;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own scenes' AND tablename = 'scenes') THEN
    create policy "Users can view own scenes" on public.scenes for select
    using (exists (select 1 from public.chapters join public.books on books.id = chapters.book_id join public.projects on projects.id = books.project_id where chapters.id = scenes.chapter_id and projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create scenes in own chapters' AND tablename = 'scenes') THEN
    create policy "Users can create scenes in own chapters" on public.scenes for insert
    with check (exists (select 1 from public.chapters join public.books on books.id = chapters.book_id join public.projects on projects.id = books.project_id where chapters.id = chapter_id and projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own scenes' AND tablename = 'scenes') THEN
    create policy "Users can update own scenes" on public.scenes for update
    using (exists (select 1 from public.chapters join public.books on books.id = chapters.book_id join public.projects on projects.id = books.project_id where chapters.id = scenes.chapter_id and projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own scenes' AND tablename = 'scenes') THEN
    create policy "Users can delete own scenes" on public.scenes for delete
    using (exists (select 1 from public.chapters join public.books on books.id = chapters.book_id join public.projects on projects.id = books.project_id where chapters.id = scenes.chapter_id and projects.user_id = auth.uid()));
  END IF;
END $$;

-- NODE TYPE ENUM
DO $$ BEGIN
  CREATE TYPE node_type AS ENUM ('character', 'location', 'item', 'event', 'faction', 'concept');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- STORY_NODES TABLE
create table if not exists public.story_nodes (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  node_type node_type not null,
  name text not null,
  description text,
  notes text,
  image_url text,
  character_role text,
  character_arc text,
  location_type text,
  event_date text,
  embedding vector(1536),
  attributes jsonb default '{}',
  tags text[],
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_story_nodes_embedding on public.story_nodes using ivfflat (embedding vector_cosine_ops) with (lists = 100);

alter table public.story_nodes enable row level security;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own story nodes' AND tablename = 'story_nodes') THEN
    create policy "Users can view own story nodes" on public.story_nodes for select
    using (exists (select 1 from public.projects where projects.id = story_nodes.project_id and projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create story nodes in own projects' AND tablename = 'story_nodes') THEN
    create policy "Users can create story nodes in own projects" on public.story_nodes for insert
    with check (exists (select 1 from public.projects where projects.id = project_id and projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own story nodes' AND tablename = 'story_nodes') THEN
    create policy "Users can update own story nodes" on public.story_nodes for update
    using (exists (select 1 from public.projects where projects.id = story_nodes.project_id and projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own story nodes' AND tablename = 'story_nodes') THEN
    create policy "Users can delete own story nodes" on public.story_nodes for delete
    using (exists (select 1 from public.projects where projects.id = story_nodes.project_id and projects.user_id = auth.uid()));
  END IF;
END $$;

-- Add FK constraints to scenes
DO $$ BEGIN
  ALTER TABLE public.scenes ADD CONSTRAINT scenes_location_fk FOREIGN KEY (location_id) REFERENCES public.story_nodes(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE public.scenes ADD CONSTRAINT scenes_pov_character_fk FOREIGN KEY (pov_character_id) REFERENCES public.story_nodes(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- STORY_EDGES TABLE
create table if not exists public.story_edges (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  source_node_id uuid references public.story_nodes(id) on delete cascade not null,
  target_node_id uuid references public.story_nodes(id) on delete cascade not null,
  relationship_type text not null,
  label text,
  description text,
  valid_from_book_id uuid references public.books(id) on delete set null,
  valid_until_book_id uuid references public.books(id) on delete set null,
  weight integer default 5 check (weight >= 1 and weight <= 10),
  is_bidirectional boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(source_node_id, target_node_id, relationship_type)
);

alter table public.story_edges enable row level security;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own story edges' AND tablename = 'story_edges') THEN
    create policy "Users can view own story edges" on public.story_edges for select
    using (exists (select 1 from public.projects where projects.id = story_edges.project_id and projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create story edges in own projects' AND tablename = 'story_edges') THEN
    create policy "Users can create story edges in own projects" on public.story_edges for insert
    with check (exists (select 1 from public.projects where projects.id = project_id and projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own story edges' AND tablename = 'story_edges') THEN
    create policy "Users can update own story edges" on public.story_edges for update
    using (exists (select 1 from public.projects where projects.id = story_edges.project_id and projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own story edges' AND tablename = 'story_edges') THEN
    create policy "Users can delete own story edges" on public.story_edges for delete
    using (exists (select 1 from public.projects where projects.id = story_edges.project_id and projects.user_id = auth.uid()));
  END IF;
END $$;

-- SCENE_CHARACTERS TABLE
create table if not exists public.scene_characters (
  id uuid default uuid_generate_v4() primary key,
  scene_id uuid references public.scenes(id) on delete cascade not null,
  character_id uuid references public.story_nodes(id) on delete cascade not null,
  role_in_scene text,
  created_at timestamptz default now() not null,
  unique(scene_id, character_id)
);

alter table public.scene_characters enable row level security;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own scene characters' AND tablename = 'scene_characters') THEN
    create policy "Users can view own scene characters" on public.scene_characters for select
    using (exists (select 1 from public.scenes join public.chapters on chapters.id = scenes.chapter_id join public.books on books.id = chapters.book_id join public.projects on projects.id = books.project_id where scenes.id = scene_characters.scene_id and projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create scene characters' AND tablename = 'scene_characters') THEN
    create policy "Users can create scene characters" on public.scene_characters for insert
    with check (exists (select 1 from public.scenes join public.chapters on chapters.id = scenes.chapter_id join public.books on books.id = chapters.book_id join public.projects on projects.id = books.project_id where scenes.id = scene_id and projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete scene characters' AND tablename = 'scene_characters') THEN
    create policy "Users can delete scene characters" on public.scene_characters for delete
    using (exists (select 1 from public.scenes join public.chapters on chapters.id = scenes.chapter_id join public.books on books.id = chapters.book_id join public.projects on projects.id = books.project_id where scenes.id = scene_characters.scene_id and projects.user_id = auth.uid()));
  END IF;
END $$;

-- Updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at before update on public.profiles for each row execute function update_updated_at_column();

drop trigger if exists update_projects_updated_at on public.projects;
create trigger update_projects_updated_at before update on public.projects for each row execute function update_updated_at_column();

drop trigger if exists update_books_updated_at on public.books;
create trigger update_books_updated_at before update on public.books for each row execute function update_updated_at_column();

drop trigger if exists update_chapters_updated_at on public.chapters;
create trigger update_chapters_updated_at before update on public.chapters for each row execute function update_updated_at_column();

drop trigger if exists update_scenes_updated_at on public.scenes;
create trigger update_scenes_updated_at before update on public.scenes for each row execute function update_updated_at_column();

drop trigger if exists update_story_nodes_updated_at on public.story_nodes;
create trigger update_story_nodes_updated_at before update on public.story_nodes for each row execute function update_updated_at_column();

drop trigger if exists update_story_edges_updated_at on public.story_edges;
create trigger update_story_edges_updated_at before update on public.story_edges for each row execute function update_updated_at_column();

-- INDEXES
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_books_project_id on public.books(project_id);
create index if not exists idx_chapters_book_id on public.chapters(book_id);
create index if not exists idx_scenes_chapter_id on public.scenes(chapter_id);
create index if not exists idx_story_nodes_project_id on public.story_nodes(project_id);
create index if not exists idx_story_nodes_type on public.story_nodes(node_type);
create index if not exists idx_story_edges_project_id on public.story_edges(project_id);
create index if not exists idx_story_edges_source on public.story_edges(source_node_id);
create index if not exists idx_story_edges_target on public.story_edges(target_node_id);
create index if not exists idx_scene_characters_scene on public.scene_characters(scene_id);
create index if not exists idx_scene_characters_character on public.scene_characters(character_id);

-- ============================================================================
-- MIGRATION 2: ADD MISSING COLUMNS
-- ============================================================================

ALTER TABLE public.story_nodes ADD COLUMN IF NOT EXISTS position_x float DEFAULT 0;
ALTER TABLE public.story_nodes ADD COLUMN IF NOT EXISTS position_y float DEFAULT 0;
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;
UPDATE public.chapters SET order_index = sort_order WHERE order_index = 0 AND sort_order > 0;
UPDATE public.scenes SET order_index = sort_order WHERE order_index = 0 AND sort_order > 0;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS synopsis text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS world_description text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS words_used_this_month integer DEFAULT 0;
ALTER TABLE public.scene_characters ADD COLUMN IF NOT EXISTS pov boolean DEFAULT false;
ALTER TABLE public.scene_characters ADD COLUMN IF NOT EXISTS node_id uuid;
UPDATE public.scene_characters SET node_id = character_id WHERE node_id IS NULL;

-- ============================================================================
-- MIGRATION 3: WORD COUNT GOALS
-- ============================================================================

ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS target_word_count integer;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS target_word_count integer;

-- ============================================================================
-- MIGRATION 4: STORY UNIVERSE SCHEMA
-- ============================================================================

ALTER TABLE public.books ADD COLUMN IF NOT EXISTS pov_style text;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS pov_character_ids uuid[];
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS tense text;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS prose_style text;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS pacing text;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS dialogue_style text;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS description_density text;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS content_rating text;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS violence_level text;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS romance_level text;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS profanity_level text;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS tone text[];

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS subgenres text[];
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS target_audience text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS content_rating text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS narrative_conventions text[];
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS series_type text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS planned_books integer;

ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS scene_type text;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS tension_level text;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS mood text;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS time_of_day text;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS weather text;

-- BOOK_CHARACTERS TABLE
CREATE TABLE IF NOT EXISTS public.book_characters (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  book_id uuid REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  node_id uuid REFERENCES public.story_nodes(id) ON DELETE CASCADE NOT NULL,
  role_in_book text,
  is_pov_character boolean DEFAULT false,
  introduction_chapter_id uuid REFERENCES public.chapters(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(book_id, node_id)
);

ALTER TABLE public.book_characters ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own book characters' AND tablename = 'book_characters') THEN
    CREATE POLICY "Users can view own book characters" ON public.book_characters FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.books JOIN public.projects ON projects.id = books.project_id WHERE books.id = book_characters.book_id AND projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create book characters' AND tablename = 'book_characters') THEN
    CREATE POLICY "Users can create book characters" ON public.book_characters FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.books JOIN public.projects ON projects.id = books.project_id WHERE books.id = book_id AND projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own book characters' AND tablename = 'book_characters') THEN
    CREATE POLICY "Users can update own book characters" ON public.book_characters FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.books JOIN public.projects ON projects.id = books.project_id WHERE books.id = book_characters.book_id AND projects.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own book characters' AND tablename = 'book_characters') THEN
    CREATE POLICY "Users can delete own book characters" ON public.book_characters FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.books JOIN public.projects ON projects.id = books.project_id WHERE books.id = book_characters.book_id AND projects.user_id = auth.uid()));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_book_characters_book ON public.book_characters(book_id);
CREATE INDEX IF NOT EXISTS idx_book_characters_node ON public.book_characters(node_id);

-- ============================================================================
-- MIGRATION 5: ENHANCED GRAPH RPC
-- ============================================================================

drop function if exists get_connected_subgraph(uuid, uuid[], integer, uuid);

create or replace function get_connected_subgraph(
  p_project_id uuid,
  p_focus_node_ids uuid[],
  p_depth integer default 2,
  p_current_book_id uuid default null
)
returns table (
  node_id uuid,
  node_type node_type,
  node_name text,
  node_description text,
  node_attributes jsonb,
  node_character_role text,
  node_character_arc text,
  node_location_type text,
  node_event_date text,
  node_tags text[],
  edge_id uuid,
  edge_type text,
  edge_label text,
  edge_description text,
  edge_weight integer,
  edge_is_bidirectional boolean,
  connected_to uuid,
  depth integer
) as $$
with recursive graph_traversal as (
  select
    sn.id as node_id,
    sn.node_type,
    sn.name as node_name,
    sn.description as node_description,
    sn.attributes as node_attributes,
    sn.character_role as node_character_role,
    sn.character_arc as node_character_arc,
    sn.location_type as node_location_type,
    sn.event_date as node_event_date,
    sn.tags as node_tags,
    null::uuid as edge_id,
    null::text as edge_type,
    null::text as edge_label,
    null::text as edge_description,
    null::integer as edge_weight,
    null::boolean as edge_is_bidirectional,
    null::uuid as connected_to,
    0 as depth
  from public.story_nodes sn
  where sn.id = any(p_focus_node_ids)
    and sn.project_id = p_project_id

  union all

  select
    sn.id as node_id,
    sn.node_type,
    sn.name as node_name,
    sn.description as node_description,
    sn.attributes as node_attributes,
    sn.character_role as node_character_role,
    sn.character_arc as node_character_arc,
    sn.location_type as node_location_type,
    sn.event_date as node_event_date,
    sn.tags as node_tags,
    se.id as edge_id,
    se.relationship_type as edge_type,
    se.label as edge_label,
    se.description as edge_description,
    se.weight as edge_weight,
    se.is_bidirectional as edge_is_bidirectional,
    gt.node_id as connected_to,
    gt.depth + 1 as depth
  from graph_traversal gt
  join public.story_edges se on (
    se.source_node_id = gt.node_id or
    (se.target_node_id = gt.node_id and se.is_bidirectional)
  )
  join public.story_nodes sn on (
    sn.id = case
      when se.source_node_id = gt.node_id then se.target_node_id
      else se.source_node_id
    end
  )
  where gt.depth < p_depth
    and sn.project_id = p_project_id
    and (
      p_current_book_id is null
      or (
        (se.valid_from_book_id is null or se.valid_from_book_id <= p_current_book_id)
        and (se.valid_until_book_id is null or se.valid_until_book_id >= p_current_book_id)
      )
    )
)
select distinct on (gt.node_id, gt.edge_id)
  gt.node_id,
  gt.node_type,
  gt.node_name,
  gt.node_description,
  gt.node_attributes,
  gt.node_character_role,
  gt.node_character_arc,
  gt.node_location_type,
  gt.node_event_date,
  gt.node_tags,
  gt.edge_id,
  gt.edge_type,
  gt.edge_label,
  gt.edge_description,
  gt.edge_weight,
  gt.edge_is_bidirectional,
  gt.connected_to,
  gt.depth
from graph_traversal gt
order by gt.node_id, gt.edge_id, gt.depth;
$$ language sql stable;

-- ============================================================================
-- MIGRATION 6: AI USAGE TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  scene_id UUID REFERENCES scenes(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  input_cost_cents NUMERIC(10, 4) DEFAULT 0,
  output_cost_cents NUMERIC(10, 4) DEFAULT 0,
  total_cost_cents NUMERIC(10, 4) GENERATED ALWAYS AS (input_cost_cents + output_cost_cents) STORED,
  request_duration_ms INTEGER,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_project_id ON ai_usage(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_endpoint ON ai_usage(endpoint);
CREATE INDEX IF NOT EXISTS idx_ai_usage_model ON ai_usage(model);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own usage' AND tablename = 'ai_usage') THEN
    CREATE POLICY "Users can view own usage" ON ai_usage FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can insert usage' AND tablename = 'ai_usage') THEN
    CREATE POLICY "Service role can insert usage" ON ai_usage FOR INSERT WITH CHECK (true);
  END IF;
END $$;

CREATE OR REPLACE VIEW user_ai_usage_summary AS
SELECT
  user_id,
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS total_requests,
  SUM(input_tokens) AS total_input_tokens,
  SUM(output_tokens) AS total_output_tokens,
  SUM(input_tokens + output_tokens) AS total_tokens,
  SUM(input_cost_cents + output_cost_cents) / 100.0 AS total_cost_usd,
  endpoint,
  model
FROM ai_usage
WHERE status = 'success'
GROUP BY user_id, DATE_TRUNC('month', created_at), endpoint, model;

GRANT SELECT ON user_ai_usage_summary TO authenticated;

-- ============================================================================
-- MIGRATION 7: BILLING PERIOD TRACKING
-- ============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS billing_period_start date DEFAULT CURRENT_DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS billing_period_end date DEFAULT (CURRENT_DATE + INTERVAL '1 month')::date;

ALTER TABLE public.profiles ALTER COLUMN words_quota SET DEFAULT 10000;

UPDATE public.profiles SET words_quota = 10000 WHERE subscription_tier = 'free' AND words_quota = 5000;

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);

CREATE OR REPLACE FUNCTION reset_monthly_word_usage(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET
    words_used_this_month = 0,
    billing_period_start = CURRENT_DATE,
    billing_period_end = (CURRENT_DATE + INTERVAL '1 month')::date
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_and_reset_billing_period(user_id uuid)
RETURNS boolean AS $$
DECLARE
  period_end date;
BEGIN
  SELECT billing_period_end INTO period_end
  FROM public.profiles
  WHERE id = user_id;

  IF period_end IS NULL OR CURRENT_DATE >= period_end THEN
    PERFORM reset_monthly_word_usage(user_id);
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_word_usage(user_id uuid, word_count integer)
RETURNS void AS $$
BEGIN
  PERFORM check_and_reset_billing_period(user_id);
  UPDATE public.profiles
  SET words_used_this_month = COALESCE(words_used_this_month, 0) + word_count
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DONE! All migrations applied successfully.
-- ============================================================================
