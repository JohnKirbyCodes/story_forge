-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,

  -- Stripe billing
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text default 'free' check (subscription_status in ('free', 'pro', 'canceled')),
  subscription_period_end timestamptz,

  -- Usage tracking
  words_generated_this_month integer default 0,
  words_quota integer default 5000, -- Free tier: 5k words/month

  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- RLS for profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- PROJECTS TABLE (Universe/World)
-- ============================================================================
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,

  title text not null,
  description text,
  genre text,
  cover_image_url text,

  -- World Bible / Universe settings
  world_setting text, -- General world description
  time_period text,
  themes text[], -- Array of theme tags

  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- RLS for projects
alter table public.projects enable row level security;

create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can create own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- BOOKS TABLE
-- ============================================================================
create table public.books (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,

  title text not null,
  subtitle text,
  description text,
  cover_image_url text,

  -- Book metadata
  target_word_count integer,
  current_word_count integer default 0,
  status text default 'draft' check (status in ('draft', 'in_progress', 'complete', 'published')),

  -- Ordering within project
  sort_order integer default 0,

  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- RLS for books
alter table public.books enable row level security;

create policy "Users can view own books"
  on public.books for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = books.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can create books in own projects"
  on public.books for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can update own books"
  on public.books for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = books.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own books"
  on public.books for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = books.project_id
      and projects.user_id = auth.uid()
    )
  );

-- ============================================================================
-- CHAPTERS TABLE
-- ============================================================================
create table public.chapters (
  id uuid default uuid_generate_v4() primary key,
  book_id uuid references public.books(id) on delete cascade not null,

  title text not null,
  summary text,

  -- Optional part grouping (for multi-part books)
  part_number integer,
  part_title text,

  -- Ordering
  sort_order integer default 0,

  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- RLS for chapters
alter table public.chapters enable row level security;

create policy "Users can view own chapters"
  on public.chapters for select
  using (
    exists (
      select 1 from public.books
      join public.projects on projects.id = books.project_id
      where books.id = chapters.book_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can create chapters in own books"
  on public.chapters for insert
  with check (
    exists (
      select 1 from public.books
      join public.projects on projects.id = books.project_id
      where books.id = book_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can update own chapters"
  on public.chapters for update
  using (
    exists (
      select 1 from public.books
      join public.projects on projects.id = books.project_id
      where books.id = chapters.book_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own chapters"
  on public.chapters for delete
  using (
    exists (
      select 1 from public.books
      join public.projects on projects.id = books.project_id
      where books.id = chapters.book_id
      and projects.user_id = auth.uid()
    )
  );

-- ============================================================================
-- SCENES TABLE
-- ============================================================================
create table public.scenes (
  id uuid default uuid_generate_v4() primary key,
  chapter_id uuid references public.chapters(id) on delete cascade not null,

  title text,

  -- The core writing content
  beat_instructions text, -- User's high-level instructions (left pane)
  generated_prose text, -- AI-generated content
  edited_prose text, -- User's edited version (right pane)

  -- Scene metadata
  location_id uuid, -- Reference to story_nodes (location)
  time_in_story text, -- When this scene takes place in story timeline
  pov_character_id uuid, -- Reference to story_nodes (character)

  -- Word counts
  word_count integer default 0,

  -- Ordering
  sort_order integer default 0,

  -- AI generation metadata
  last_generated_at timestamptz,
  generation_model text,

  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- RLS for scenes
alter table public.scenes enable row level security;

create policy "Users can view own scenes"
  on public.scenes for select
  using (
    exists (
      select 1 from public.chapters
      join public.books on books.id = chapters.book_id
      join public.projects on projects.id = books.project_id
      where chapters.id = scenes.chapter_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can create scenes in own chapters"
  on public.scenes for insert
  with check (
    exists (
      select 1 from public.chapters
      join public.books on books.id = chapters.book_id
      join public.projects on projects.id = books.project_id
      where chapters.id = chapter_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can update own scenes"
  on public.scenes for update
  using (
    exists (
      select 1 from public.chapters
      join public.books on books.id = chapters.book_id
      join public.projects on projects.id = books.project_id
      where chapters.id = scenes.chapter_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own scenes"
  on public.scenes for delete
  using (
    exists (
      select 1 from public.chapters
      join public.books on books.id = chapters.book_id
      join public.projects on projects.id = books.project_id
      where chapters.id = scenes.chapter_id
      and projects.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STORY_NODES TABLE (Knowledge Graph Entities)
-- ============================================================================
create type node_type as enum (
  'character',
  'location',
  'item',
  'event',
  'faction',
  'concept'
);

create table public.story_nodes (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,

  node_type node_type not null,
  name text not null,

  -- Rich content
  description text,
  notes text, -- Private author notes
  image_url text,

  -- Character-specific fields
  character_role text, -- protagonist, antagonist, supporting, minor
  character_arc text,

  -- Location-specific fields
  location_type text, -- city, building, room, wilderness, etc.

  -- Event-specific fields
  event_date text, -- In-story date/time

  -- For AI context retrieval
  embedding vector(1536), -- OpenAI ada-002 embedding dimension

  -- Custom attributes (flexible JSON)
  attributes jsonb default '{}',

  -- Tags for filtering
  tags text[],

  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Index for vector similarity search
create index on public.story_nodes using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- RLS for story_nodes
alter table public.story_nodes enable row level security;

create policy "Users can view own story nodes"
  on public.story_nodes for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = story_nodes.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can create story nodes in own projects"
  on public.story_nodes for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can update own story nodes"
  on public.story_nodes for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = story_nodes.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own story nodes"
  on public.story_nodes for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = story_nodes.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Add foreign key constraints to scenes now that story_nodes exists
alter table public.scenes
  add constraint scenes_location_fk
  foreign key (location_id) references public.story_nodes(id) on delete set null;

alter table public.scenes
  add constraint scenes_pov_character_fk
  foreign key (pov_character_id) references public.story_nodes(id) on delete set null;

-- ============================================================================
-- STORY_EDGES TABLE (Relationships between nodes)
-- ============================================================================
create table public.story_edges (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,

  -- The relationship
  source_node_id uuid references public.story_nodes(id) on delete cascade not null,
  target_node_id uuid references public.story_nodes(id) on delete cascade not null,

  -- Relationship type and description
  relationship_type text not null, -- e.g., "parent_of", "loves", "rivals_with", "located_in"
  label text, -- Human-readable label for the edge
  description text, -- Detailed description of the relationship

  -- Timeline validity (for relationships that change over time)
  valid_from_book_id uuid references public.books(id) on delete set null,
  valid_until_book_id uuid references public.books(id) on delete set null,

  -- Relationship strength/importance (1-10)
  weight integer default 5 check (weight >= 1 and weight <= 10),

  -- Bidirectional flag
  is_bidirectional boolean default false,

  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- Prevent duplicate edges
  unique(source_node_id, target_node_id, relationship_type)
);

-- RLS for story_edges
alter table public.story_edges enable row level security;

create policy "Users can view own story edges"
  on public.story_edges for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = story_edges.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can create story edges in own projects"
  on public.story_edges for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can update own story edges"
  on public.story_edges for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = story_edges.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own story edges"
  on public.story_edges for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = story_edges.project_id
      and projects.user_id = auth.uid()
    )
  );

-- ============================================================================
-- SCENE_CHARACTERS TABLE (M2M: Scenes <-> Characters)
-- ============================================================================
create table public.scene_characters (
  id uuid default uuid_generate_v4() primary key,
  scene_id uuid references public.scenes(id) on delete cascade not null,
  character_id uuid references public.story_nodes(id) on delete cascade not null,

  -- Role in this specific scene
  role_in_scene text, -- e.g., "protagonist", "antagonist", "mentioned"

  created_at timestamptz default now() not null,

  unique(scene_id, character_id)
);

-- RLS for scene_characters
alter table public.scene_characters enable row level security;

create policy "Users can view own scene characters"
  on public.scene_characters for select
  using (
    exists (
      select 1 from public.scenes
      join public.chapters on chapters.id = scenes.chapter_id
      join public.books on books.id = chapters.book_id
      join public.projects on projects.id = books.project_id
      where scenes.id = scene_characters.scene_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can create scene characters"
  on public.scene_characters for insert
  with check (
    exists (
      select 1 from public.scenes
      join public.chapters on chapters.id = scenes.chapter_id
      join public.books on books.id = chapters.book_id
      join public.projects on projects.id = books.project_id
      where scenes.id = scene_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete scene characters"
  on public.scene_characters for delete
  using (
    exists (
      select 1 from public.scenes
      join public.chapters on chapters.id = scenes.chapter_id
      join public.books on books.id = chapters.book_id
      join public.projects on projects.id = books.project_id
      where scenes.id = scene_characters.scene_id
      and projects.user_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get connected subgraph for AI context
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
  edge_id uuid,
  edge_type text,
  edge_label text,
  edge_description text,
  connected_to uuid,
  depth integer
) as $$
with recursive graph_traversal as (
  -- Base case: start with focus nodes
  select
    sn.id as node_id,
    sn.node_type,
    sn.name as node_name,
    sn.description as node_description,
    null::uuid as edge_id,
    null::text as edge_type,
    null::text as edge_label,
    null::text as edge_description,
    null::uuid as connected_to,
    0 as depth
  from public.story_nodes sn
  where sn.id = any(p_focus_node_ids)
    and sn.project_id = p_project_id

  union all

  -- Recursive case: traverse edges
  select
    sn.id as node_id,
    sn.node_type,
    sn.name as node_name,
    sn.description as node_description,
    se.id as edge_id,
    se.relationship_type as edge_type,
    se.label as edge_label,
    se.description as edge_description,
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
    and se.project_id = p_project_id
    -- Check timeline validity
    and (se.valid_from_book_id is null or p_current_book_id is null or exists(
      select 1 from public.books b1, public.books b2
      where b1.id = se.valid_from_book_id
      and b2.id = p_current_book_id
      and b1.sort_order <= b2.sort_order
    ))
    and (se.valid_until_book_id is null or p_current_book_id is null or exists(
      select 1 from public.books b1, public.books b2
      where b1.id = se.valid_until_book_id
      and b2.id = p_current_book_id
      and b1.sort_order >= b2.sort_order
    ))
)
select distinct * from graph_traversal;
$$ language sql stable;

-- Updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function update_updated_at_column();

create trigger update_projects_updated_at before update on public.projects
  for each row execute function update_updated_at_column();

create trigger update_books_updated_at before update on public.books
  for each row execute function update_updated_at_column();

create trigger update_chapters_updated_at before update on public.chapters
  for each row execute function update_updated_at_column();

create trigger update_scenes_updated_at before update on public.scenes
  for each row execute function update_updated_at_column();

create trigger update_story_nodes_updated_at before update on public.story_nodes
  for each row execute function update_updated_at_column();

create trigger update_story_edges_updated_at before update on public.story_edges
  for each row execute function update_updated_at_column();

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
create index idx_projects_user_id on public.projects(user_id);
create index idx_books_project_id on public.books(project_id);
create index idx_chapters_book_id on public.chapters(book_id);
create index idx_scenes_chapter_id on public.scenes(chapter_id);
create index idx_story_nodes_project_id on public.story_nodes(project_id);
create index idx_story_nodes_type on public.story_nodes(node_type);
create index idx_story_edges_project_id on public.story_edges(project_id);
create index idx_story_edges_source on public.story_edges(source_node_id);
create index idx_story_edges_target on public.story_edges(target_node_id);
create index idx_scene_characters_scene on public.scene_characters(scene_id);
create index idx_scene_characters_character on public.scene_characters(character_id);
