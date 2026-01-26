# Product Requirements Document (PRD): StoryForge AI
## Version 2.1 - Enhanced for Vercel + Supabase Implementation

---

## 1. Executive Summary

**StoryForge AI** is a professional-grade, AI-assisted novel writing platform delivered as a SaaS. Unlike generic chat interfaces, StoryForge separates the **World Context** from the **Drafting Process**.

### Core Differentiator: Knowledge Graph Architecture
Instead of flat lists of characters, StoryForge models the story as a connected graph of **Nodes** (People, Places, Events) and **Edges** (Relationships).

### Series Architecture (v2)
A "Project" acts as the container for a fictional universe (The World Bible). Within a Project, a user can create multiple **Books** (Manuscripts) that all share the same context graph—ideal for writing trilogies or series.

| Attribute | Value |
|-----------|-------|
| Target Audience | Amateur to semi-pro fiction writers |
| Monetization | Freemium (Stripe Subscription) |
| Hosting | Vercel (Frontend + API Routes) |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| AI Provider | Anthropic Claude API |

---

## 2. Core Business Features

### 2.1 The Knowledge Graph (Shared World Engine)

Users define the "truth" of their universe at the **Project Level**.

**Shared Context:** If you kill a character in Book 1, that context is preserved in the graph for Book 2.

**Nodes (Entities):**
- Characters (with traits, backstory, arc)
- Locations (with atmosphere, history)
- Items (magical objects, MacGuffins)
- Historical Events (wars, discoveries)
- Factions (organizations, kingdoms)
- Concepts (magic systems, technologies)

**Edges (Connections):** Typed, weighted relationships connecting any two nodes.

Examples:
- `Alice --(hates, weight:9)--> Bob`
- `Bob --(born_in)--> The Shire`
- `The Ring --(corrupts)--> Frodo`
- `Gandalf --(member_of)--> The Istari`

**Graph Timeline Support:** Edges can have optional `valid_from_book` and `valid_until_book` fields to track relationship changes across a series (e.g., "allies" in Book 1 becomes "enemies" in Book 2).

### 2.2 The Intelligent Editor (Multi-Book Support)

A hierarchical drafting environment:

```
Project (World/Universe)
  └── Book 1 (Manuscript)
  │     └── Part I (Optional grouping)
  │           └── Chapter 1
  │                 └── Scene 1
  │                 └── Scene 2
  └── Book 2 (Manuscript)
        └── ...
```

**Split-Pane Editor:**
- **Left Pane (The Director):** User writes high-level "Beats" (narrative instructions)
- **Right Pane (The Scribe):** AI generates prose based on beats + active context
- **Bottom Panel (Context Inspector):** Shows which graph nodes are "active" for current scene

### 2.3 The AI Agent Architecture

We deploy an **AI Agent** with structured tool use—not simple API calls.

**Agent Capabilities:**
1. **Context Retrieval:** Graph queries to gather relevant context from shared project graph
2. **Self-Correction:** Checks graph to prevent contradictions between books
3. **Continuity Enforcement:** Validates character states, location details, timeline consistency
4. **Gatekeeping:** Checks Stripe limits before generation
5. **Style Matching:** Analyzes previous scenes to maintain consistent voice

**Agent Tools:**
- `query_knowledge_graph` - Retrieve connected subgraph
- `semantic_search_nodes` - Vector similarity search
- `get_scene_context` - Previous scene summaries from same book
- `check_continuity` - Validate against established facts
- `check_quota` - Verify user has available words

### 2.4 Monetization (Stripe)

| Feature | Free Tier | Pro Tier ($15/mo) | Team Tier ($39/mo) |
|---------|-----------|-------------------|---------------------|
| Projects | 1 | Unlimited | Unlimited |
| Books per Project | 1 | Unlimited | Unlimited |
| Graph Nodes | 50 | Unlimited | Unlimited |
| AI Words/Month | 5,000 | 100,000 | 500,000 |
| Export Formats | TXT only | DOCX, EPUB, PDF | All + Custom CSS |
| Version History | 7 days | 90 days | Unlimited |
| Collaborators | - | - | Up to 5 |

---

## 3. Technical Specifications

### 3.1 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 14 (App Router) | Full-stack React framework |
| Language | TypeScript (strict mode) | Type safety |
| Styling | Tailwind CSS + shadcn/ui | Component library |
| State (Server) | TanStack Query v5 | Data fetching & caching |
| State (Client) | Zustand | Editor state, UI state |
| Database | Supabase PostgreSQL | Primary data store |
| Auth | Supabase Auth | Authentication |
| Storage | Supabase Storage | File exports, images |
| Vector Search | pgvector (Supabase) | Semantic search |
| Real-time | Supabase Realtime | Collaboration (future) |
| AI | Anthropic Claude API | Text generation |
| AI Streaming | Vercel AI SDK | Stream responses |
| Payments | Stripe | Subscriptions |
| Graph Visualization | React Flow | Visual graph editing |
| Rich Text | Tiptap | WYSIWYG editor |
| Deployment | Vercel | Hosting + Edge |
| Monitoring | Vercel Analytics + Sentry | Performance & errors |

### 3.2 Project Structure

```
storyforge/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/route.ts
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar + header
│   │   ├── page.tsx                # Projects list
│   │   ├── projects/
│   │   │   ├── [projectId]/
│   │   │   │   ├── page.tsx        # Project home (graph + books)
│   │   │   │   ├── graph/page.tsx  # Full graph editor
│   │   │   │   ├── books/
│   │   │   │   │   └── [bookId]/
│   │   │   │   │       ├── page.tsx      # Book outline
│   │   │   │   │       └── editor/
│   │   │   │   │           └── [sceneId]/page.tsx  # Scene editor
│   │   │   │   └── settings/page.tsx
│   │   └── settings/
│   │       ├── page.tsx            # Account settings
│   │       └── billing/page.tsx    # Stripe portal
│   ├── api/
│   │   ├── ai/
│   │   │   ├── generate-scene/route.ts
│   │   │   ├── generate-summary/route.ts
│   │   │   └── check-continuity/route.ts
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts
│   │   │   ├── portal/route.ts
│   │   │   └── webhook/route.ts
│   │   ├── export/
│   │   │   └── [bookId]/route.ts
│   │   └── vectorize/route.ts
│   ├── layout.tsx
│   └── page.tsx                    # Landing page
├── components/
│   ├── ui/                         # shadcn components
│   ├── editor/
│   │   ├── TiptapEditor.tsx
│   │   ├── BeatPanel.tsx
│   │   ├── ContextInspector.tsx
│   │   └── SceneHeader.tsx
│   ├── graph/
│   │   ├── GraphCanvas.tsx
│   │   ├── NodePanel.tsx
│   │   ├── EdgePanel.tsx
│   │   └── NodeTypeIcon.tsx
│   ├── dashboard/
│   │   ├── ProjectCard.tsx
│   │   ├── BookCard.tsx
│   │   └── ChapterList.tsx
│   └── shared/
│       ├── Breadcrumbs.tsx
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client
│   │   ├── admin.ts                # Service role client
│   │   └── middleware.ts
│   ├── stripe/
│   │   ├── client.ts
│   │   └── config.ts
│   ├── ai/
│   │   ├── agent.ts                # AI agent orchestration
│   │   ├── tools.ts                # Tool definitions
│   │   ├── prompts.ts              # System prompts
│   │   └── context-builder.ts      # Graph → text conversion
│   ├── graph/
│   │   ├── queries.ts              # Graph traversal SQL
│   │   └── utils.ts
│   └── utils/
│       ├── cn.ts                   # Class name helper
│       └── format.ts
├── hooks/
│   ├── useProject.ts
│   ├── useBook.ts
│   ├── useGraph.ts
│   ├── useEditor.ts
│   └── useSubscription.ts
├── stores/
│   ├── editorStore.ts
│   └── uiStore.ts
├── types/
│   ├── database.ts                 # Generated from Supabase
│   ├── graph.ts
│   └── editor.ts
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
└── middleware.ts                   # Auth protection
```

### 3.3 Database Schema

```sql
-- ===========================================
-- STORYFORGE AI - DATABASE SCHEMA
-- Supabase PostgreSQL with pgvector
-- ===========================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";
create extension if not exists "pg_trgm";  -- For fuzzy text search

-- ===========================================
-- 1. PROFILES (User accounts & billing)
-- ===========================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  
  -- Stripe integration
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text default 'free' 
    check (subscription_status in ('free', 'pro', 'team', 'canceled', 'past_due')),
  subscription_period_end timestamptz,
  
  -- Usage tracking
  word_count_usage int default 0,
  word_count_reset_at timestamptz default now(),
  
  -- Preferences
  preferences jsonb default '{
    "theme": "system",
    "editorFontSize": 16,
    "autoSave": true,
    "showWordCount": true
  }'::jsonb,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===========================================
-- 2. PROJECTS (Universe/World Container)
-- ===========================================
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  title text not null,
  description text,
  genre text,
  cover_image_url text,
  
  -- World settings
  settings jsonb default '{
    "toneKeywords": [],
    "avoidKeywords": [],
    "targetAudience": "adult",
    "povStyle": "third_limited"
  }'::jsonb,
  
  -- Metadata
  is_archived boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_projects_user on public.projects(user_id);
create index idx_projects_archived on public.projects(user_id, is_archived);

-- ===========================================
-- 3. BOOKS (Manuscripts within a Project)
-- ===========================================
create table public.books (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  
  title text not null,
  subtitle text,
  synopsis text,
  
  order_index int default 0,
  status text default 'planning' 
    check (status in ('planning', 'drafting', 'revising', 'completed')),
  
  -- Book-level settings (can override project)
  target_word_count int,
  current_word_count int default 0,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_books_project on public.books(project_id);

-- ===========================================
-- 4. PARTS (Optional book divisions)
-- ===========================================
create table public.parts (
  id uuid default uuid_generate_v4() primary key,
  book_id uuid references public.books(id) on delete cascade not null,
  
  title text not null,
  order_index int default 0,
  
  created_at timestamptz default now()
);

create index idx_parts_book on public.parts(book_id);

-- ===========================================
-- 5. CHAPTERS
-- ===========================================
create table public.chapters (
  id uuid default uuid_generate_v4() primary key,
  book_id uuid references public.books(id) on delete cascade not null,
  part_id uuid references public.parts(id) on delete set null,
  
  title text not null,
  summary text,
  order_index int default 0,
  
  -- Chapter-level goals
  pov_character_id uuid,  -- FK added after story_nodes created
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_chapters_book on public.chapters(book_id);
create index idx_chapters_part on public.chapters(part_id);

-- ===========================================
-- 6. STORY_NODES (Graph Entities - Project-level)
-- ===========================================
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
  
  name text not null,
  type node_type not null,
  
  -- Flexible properties based on type
  properties jsonb default '{}'::jsonb,
  /*
    Character properties example:
    {
      "age": 25,
      "occupation": "Wizard",
      "traits": ["brave", "impulsive"],
      "physicalDescription": "...",
      "backstory": "...",
      "goals": "...",
      "fears": "..."
    }
    
    Location properties example:
    {
      "atmosphere": "dark and foreboding",
      "climate": "temperate",
      "population": "sparse",
      "significantHistory": "..."
    }
  */
  
  -- AI-consumable summary (auto-generated or user-edited)
  summary text,
  
  -- For semantic search
  embedding vector(1536),
  
  -- Visual graph positioning
  position_x float default 0,
  position_y float default 0,
  color text default '#6366f1',
  
  -- Soft delete for "killed" characters etc.
  is_active boolean default true,
  deactivated_in_book_id uuid references public.books(id),
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_nodes_project on public.story_nodes(project_id);
create index idx_nodes_type on public.story_nodes(project_id, type);
create index idx_nodes_embedding on public.story_nodes 
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Add FK to chapters now that story_nodes exists
alter table public.chapters 
  add constraint fk_chapters_pov 
  foreign key (pov_character_id) 
  references public.story_nodes(id) on delete set null;

-- ===========================================
-- 7. STORY_EDGES (Graph Relationships)
-- ===========================================
create table public.story_edges (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  
  source_node_id uuid references public.story_nodes(id) on delete cascade not null,
  target_node_id uuid references public.story_nodes(id) on delete cascade not null,
  
  label text not null,  -- 'loves', 'hates', 'works_for', 'located_in'
  description text,     -- Additional context
  
  -- Relationship strength/importance (1-10)
  weight int default 5 check (weight >= 1 and weight <= 10),
  
  -- Directional flag (some relationships are bidirectional)
  is_bidirectional boolean default false,
  
  -- Timeline support: when does this relationship apply?
  valid_from_book_id uuid references public.books(id),
  valid_until_book_id uuid references public.books(id),
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Prevent duplicate edges
  unique(source_node_id, target_node_id, label)
);

create index idx_edges_project on public.story_edges(project_id);
create index idx_edges_source on public.story_edges(source_node_id);
create index idx_edges_target on public.story_edges(target_node_id);

-- ===========================================
-- 8. SCENES (The actual content)
-- ===========================================
create table public.scenes (
  id uuid default uuid_generate_v4() primary key,
  chapter_id uuid references public.chapters(id) on delete cascade not null,
  
  title text not null,
  order_index int not null,
  
  -- The Director's input
  beat_instructions text,
  
  -- The Scribe's output
  generated_prose text,
  
  -- User's edited version (if different from generated)
  edited_prose text,
  
  -- Metadata
  word_count int default 0,
  status text default 'draft' 
    check (status in ('outline', 'draft', 'revised', 'final')),
  
  -- Context linking
  location_node_id uuid references public.story_nodes(id) on delete set null,
  time_of_day text,  -- 'morning', 'afternoon', 'evening', 'night'
  
  -- AI generation metadata
  last_generation_at timestamptz,
  generation_model text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_scenes_chapter on public.scenes(chapter_id);

-- ===========================================
-- 9. SCENE_CHARACTERS (Many-to-Many)
-- ===========================================
create table public.scene_characters (
  scene_id uuid references public.scenes(id) on delete cascade,
  character_node_id uuid references public.story_nodes(id) on delete cascade,
  
  -- Role in this scene
  role text default 'present' 
    check (role in ('pov', 'major', 'minor', 'mentioned', 'present')),
  
  primary key (scene_id, character_node_id)
);

-- ===========================================
-- 10. SCENE_VERSIONS (Version history)
-- ===========================================
create table public.scene_versions (
  id uuid default uuid_generate_v4() primary key,
  scene_id uuid references public.scenes(id) on delete cascade not null,
  
  prose_content text not null,
  word_count int,
  version_number int not null,
  
  -- What triggered this version
  change_type text check (change_type in ('generation', 'edit', 'autosave')),
  
  created_at timestamptz default now()
);

create index idx_versions_scene on public.scene_versions(scene_id);

-- ===========================================
-- 11. AI_GENERATION_LOG (Audit trail)
-- ===========================================
create table public.ai_generation_log (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  scene_id uuid references public.scenes(id) on delete set null,
  
  prompt_tokens int,
  completion_tokens int,
  total_tokens int,
  word_count int,
  
  model text,
  latency_ms int,
  
  -- For debugging
  context_summary text,
  
  created_at timestamptz default now()
);

create index idx_ai_log_user on public.ai_generation_log(user_id);
create index idx_ai_log_created on public.ai_generation_log(created_at);

-- ===========================================
-- 12. EXPORTS (Track generated files)
-- ===========================================
create table public.exports (
  id uuid default uuid_generate_v4() primary key,
  book_id uuid references public.books(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  format text not null check (format in ('docx', 'epub', 'pdf', 'txt', 'md')),
  file_path text,  -- Supabase Storage path
  file_size_bytes int,
  
  status text default 'processing' 
    check (status in ('processing', 'completed', 'failed')),
  error_message text,
  
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '7 days')
);

-- ===========================================
-- FUNCTIONS & TRIGGERS
-- ===========================================

-- Auto-update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to all tables with updated_at
create trigger update_profiles_timestamp before update on profiles
  for each row execute function update_updated_at();
create trigger update_projects_timestamp before update on projects
  for each row execute function update_updated_at();
create trigger update_books_timestamp before update on books
  for each row execute function update_updated_at();
create trigger update_chapters_timestamp before update on chapters
  for each row execute function update_updated_at();
create trigger update_story_nodes_timestamp before update on story_nodes
  for each row execute function update_updated_at();
create trigger update_story_edges_timestamp before update on story_edges
  for each row execute function update_updated_at();
create trigger update_scenes_timestamp before update on scenes
  for each row execute function update_updated_at();

-- Auto-calculate word count on scene update
create or replace function calculate_scene_word_count()
returns trigger as $$
begin
  new.word_count = coalesce(
    array_length(
      regexp_split_to_array(
        coalesce(new.edited_prose, new.generated_prose, ''), 
        '\s+'
      ), 
      1
    ),
    0
  );
  return new;
end;
$$ language plpgsql;

create trigger scene_word_count before insert or update on scenes
  for each row execute function calculate_scene_word_count();

-- Update book word count when scenes change
create or replace function update_book_word_count()
returns trigger as $$
begin
  update books b
  set current_word_count = (
    select coalesce(sum(s.word_count), 0)
    from scenes s
    join chapters c on s.chapter_id = c.id
    where c.book_id = b.id
  )
  where b.id = (
    select c.book_id from chapters c where c.id = coalesce(new.chapter_id, old.chapter_id)
  );
  return null;
end;
$$ language plpgsql;

create trigger update_book_words after insert or update or delete on scenes
  for each row execute function update_book_word_count();

-- Graph traversal function (recursive CTE)
create or replace function get_connected_subgraph(
  p_project_id uuid,
  p_focus_node_ids uuid[],
  p_depth int default 2,
  p_current_book_id uuid default null
)
returns table (
  node_id uuid,
  node_name text,
  node_type node_type,
  node_summary text,
  node_properties jsonb,
  connected_edges jsonb
) as $$
begin
  return query
  with recursive connected as (
    -- Base case: focus nodes
    select 
      sn.id,
      sn.name,
      sn.type,
      sn.summary,
      sn.properties,
      0 as depth
    from story_nodes sn
    where sn.id = any(p_focus_node_ids)
      and sn.project_id = p_project_id
      and sn.is_active = true
    
    union
    
    -- Recursive case: connected nodes
    select 
      sn.id,
      sn.name,
      sn.type,
      sn.summary,
      sn.properties,
      c.depth + 1
    from story_nodes sn
    join story_edges se on (
      se.source_node_id = sn.id or se.target_node_id = sn.id
    )
    join connected c on (
      se.source_node_id = c.id or se.target_node_id = c.id
    )
    where sn.id != c.id
      and sn.project_id = p_project_id
      and sn.is_active = true
      and c.depth < p_depth
      -- Check edge validity for current book
      and (se.valid_from_book_id is null or 
           se.valid_from_book_id <= p_current_book_id)
      and (se.valid_until_book_id is null or 
           se.valid_until_book_id >= p_current_book_id)
  )
  select distinct
    cn.id as node_id,
    cn.name as node_name,
    cn.type as node_type,
    cn.summary as node_summary,
    cn.properties as node_properties,
    (
      select jsonb_agg(jsonb_build_object(
        'id', se.id,
        'label', se.label,
        'description', se.description,
        'weight', se.weight,
        'target_id', case when se.source_node_id = cn.id then se.target_node_id else se.source_node_id end,
        'direction', case when se.source_node_id = cn.id then 'outgoing' else 'incoming' end
      ))
      from story_edges se
      where (se.source_node_id = cn.id or se.target_node_id = cn.id)
        and se.project_id = p_project_id
    ) as connected_edges
  from connected cn;
end;
$$ language plpgsql;

-- Semantic search function
create or replace function search_nodes_by_embedding(
  p_project_id uuid,
  p_query_embedding vector(1536),
  p_match_count int default 5,
  p_match_threshold float default 0.7
)
returns table (
  id uuid,
  name text,
  type node_type,
  summary text,
  similarity float
) as $$
begin
  return query
  select
    sn.id,
    sn.name,
    sn.type,
    sn.summary,
    1 - (sn.embedding <=> p_query_embedding) as similarity
  from story_nodes sn
  where sn.project_id = p_project_id
    and sn.is_active = true
    and sn.embedding is not null
    and 1 - (sn.embedding <=> p_query_embedding) > p_match_threshold
  order by sn.embedding <=> p_query_embedding
  limit p_match_count;
end;
$$ language plpgsql;

-- Reset monthly word count
create or replace function reset_monthly_word_count()
returns void as $$
begin
  update profiles
  set 
    word_count_usage = 0,
    word_count_reset_at = now()
  where word_count_reset_at < now() - interval '1 month';
end;
$$ language plpgsql;

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

alter table profiles enable row level security;
alter table projects enable row level security;
alter table books enable row level security;
alter table parts enable row level security;
alter table chapters enable row level security;
alter table story_nodes enable row level security;
alter table story_edges enable row level security;
alter table scenes enable row level security;
alter table scene_characters enable row level security;
alter table scene_versions enable row level security;
alter table ai_generation_log enable row level security;
alter table exports enable row level security;

-- Profiles: users can only see/edit their own
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Projects: owned by user
create policy "Users can CRUD own projects"
  on projects for all using (auth.uid() = user_id);

-- Books: project must be owned by user
create policy "Users can CRUD books in own projects"
  on books for all using (
    project_id in (select id from projects where user_id = auth.uid())
  );

-- Parts: via book->project chain
create policy "Users can CRUD parts in own books"
  on parts for all using (
    book_id in (
      select b.id from books b
      join projects p on b.project_id = p.id
      where p.user_id = auth.uid()
    )
  );

-- Chapters: via book->project chain
create policy "Users can CRUD chapters in own books"
  on chapters for all using (
    book_id in (
      select b.id from books b
      join projects p on b.project_id = p.id
      where p.user_id = auth.uid()
    )
  );

-- Story nodes: project must be owned by user
create policy "Users can CRUD nodes in own projects"
  on story_nodes for all using (
    project_id in (select id from projects where user_id = auth.uid())
  );

-- Story edges: project must be owned by user
create policy "Users can CRUD edges in own projects"
  on story_edges for all using (
    project_id in (select id from projects where user_id = auth.uid())
  );

-- Scenes: via chapter->book->project chain
create policy "Users can CRUD scenes in own chapters"
  on scenes for all using (
    chapter_id in (
      select c.id from chapters c
      join books b on c.book_id = b.id
      join projects p on b.project_id = p.id
      where p.user_id = auth.uid()
    )
  );

-- Scene characters: via scene chain
create policy "Users can CRUD scene_characters in own scenes"
  on scene_characters for all using (
    scene_id in (
      select s.id from scenes s
      join chapters c on s.chapter_id = c.id
      join books b on c.book_id = b.id
      join projects p on b.project_id = p.id
      where p.user_id = auth.uid()
    )
  );

-- Scene versions: via scene chain
create policy "Users can view versions of own scenes"
  on scene_versions for select using (
    scene_id in (
      select s.id from scenes s
      join chapters c on s.chapter_id = c.id
      join books b on c.book_id = b.id
      join projects p on b.project_id = p.id
      where p.user_id = auth.uid()
    )
  );

-- AI generation log: user owns
create policy "Users can view own AI logs"
  on ai_generation_log for select using (auth.uid() = user_id);
create policy "System can insert AI logs"
  on ai_generation_log for insert with check (auth.uid() = user_id);

-- Exports: user owns
create policy "Users can CRUD own exports"
  on exports for all using (auth.uid() = user_id);

-- ===========================================
-- STORAGE BUCKETS
-- ===========================================

-- Run in Supabase dashboard or via API
-- insert into storage.buckets (id, name, public) values ('exports', 'exports', false);
-- insert into storage.buckets (id, name, public) values ('covers', 'covers', true);
```

### 3.4 API Routes (Vercel)

#### A. AI Generation (`/api/ai/generate-scene/route.ts`)

```typescript
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { buildSceneContext } from '@/lib/ai/context-builder';
import { checkUserQuota, logGeneration } from '@/lib/ai/billing';

export const runtime = 'edge';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const { sceneId, beatInstructions, options } = await req.json();
  
  // 1. Check quota
  const quotaCheck = await checkUserQuota(user.id, 1500); // Estimated words
  if (!quotaCheck.allowed) {
    return new Response(JSON.stringify({ 
      error: 'quota_exceeded',
      message: quotaCheck.message 
    }), { status: 402 });
  }
  
  // 2. Build context
  const context = await buildSceneContext(supabase, sceneId);
  
  // 3. Generate with streaming
  const result = await streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: buildSystemPrompt(context.project),
    messages: [
      {
        role: 'user',
        content: buildGenerationPrompt(context, beatInstructions, options)
      }
    ],
    maxTokens: 4000,
    temperature: 0.8,
    onFinish: async ({ text, usage }) => {
      // Log generation and update quota
      await logGeneration(user.id, sceneId, {
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        wordCount: text.split(/\s+/).length,
        model: 'claude-sonnet-4-20250514'
      });
      
      // Save to database
      await supabase
        .from('scenes')
        .update({ 
          generated_prose: text,
          last_generation_at: new Date().toISOString(),
          generation_model: 'claude-sonnet-4-20250514'
        })
        .eq('id', sceneId);
    }
  });
  
  return result.toDataStreamResponse();
}
```

#### B. Context Builder (`/lib/ai/context-builder.ts`)

```typescript
import { SupabaseClient } from '@supabase/supabase-js';

export async function buildSceneContext(
  supabase: SupabaseClient,
  sceneId: string
) {
  // 1. Get scene with all relations
  const { data: scene } = await supabase
    .from('scenes')
    .select(`
      *,
      chapter:chapters!inner(
        *,
        book:books!inner(
          *,
          project:projects!inner(*)
        )
      ),
      location:story_nodes(*),
      characters:scene_characters(
        character:story_nodes(*)
      )
    `)
    .eq('id', sceneId)
    .single();
  
  if (!scene) throw new Error('Scene not found');
  
  const projectId = scene.chapter.book.project.id;
  const bookId = scene.chapter.book.id;
  
  // 2. Get connected subgraph for active characters + location
  const focusNodeIds = [
    scene.location_node_id,
    ...scene.characters.map((c: any) => c.character.id)
  ].filter(Boolean);
  
  const { data: subgraph } = await supabase
    .rpc('get_connected_subgraph', {
      p_project_id: projectId,
      p_focus_node_ids: focusNodeIds,
      p_depth: 2,
      p_current_book_id: bookId
    });
  
  // 3. Get previous scenes in this chapter for continuity
  const { data: previousScenes } = await supabase
    .from('scenes')
    .select('title, generated_prose, edited_prose')
    .eq('chapter_id', scene.chapter.id)
    .lt('order_index', scene.order_index)
    .order('order_index', { ascending: false })
    .limit(2);
  
  // 4. Get chapter summaries from earlier in the book
  const { data: previousChapters } = await supabase
    .from('chapters')
    .select('title, summary')
    .eq('book_id', bookId)
    .lt('order_index', scene.chapter.order_index)
    .order('order_index', { ascending: false })
    .limit(3);
  
  return {
    scene,
    project: scene.chapter.book.project,
    book: scene.chapter.book,
    chapter: scene.chapter,
    subgraph: formatSubgraphForPrompt(subgraph),
    previousScenes: formatPreviousScenes(previousScenes),
    previousChapters: formatPreviousChapters(previousChapters)
  };
}

function formatSubgraphForPrompt(subgraph: any[]): string {
  if (!subgraph?.length) return 'No connected context available.';
  
  let output = '## Active Story Elements\n\n';
  
  // Group by type
  const byType = subgraph.reduce((acc, node) => {
    acc[node.node_type] = acc[node.node_type] || [];
    acc[node.node_type].push(node);
    return acc;
  }, {} as Record<string, any[]>);
  
  for (const [type, nodes] of Object.entries(byType)) {
    output += `### ${type.charAt(0).toUpperCase() + type.slice(1)}s\n\n`;
    
    for (const node of nodes) {
      output += `**${node.node_name}**\n`;
      if (node.node_summary) {
        output += `${node.node_summary}\n`;
      }
      
      // Add relationships
      if (node.connected_edges?.length) {
        output += 'Relationships:\n';
        for (const edge of node.connected_edges) {
          const direction = edge.direction === 'outgoing' ? '→' : '←';
          output += `- ${direction} ${edge.label}: (weight: ${edge.weight})\n`;
        }
      }
      output += '\n';
    }
  }
  
  return output;
}
```

#### C. Stripe Webhook (`/api/stripe/webhook/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  const supabase = createAdminClient();
  
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      await supabase
        .from('profiles')
        .update({
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          subscription_status: 'pro'
        })
        .eq('id', session.metadata?.userId);
      break;
    }
    
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      
      const status = subscription.status === 'active' ? 'pro' : 
                     subscription.status === 'past_due' ? 'past_due' : 'canceled';
      
      await supabase
        .from('profiles')
        .update({
          subscription_status: status,
          subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString()
        })
        .eq('stripe_subscription_id', subscription.id);
      break;
    }
    
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'free',
          stripe_subscription_id: null
        })
        .eq('stripe_subscription_id', subscription.id);
      break;
    }
  }
  
  return NextResponse.json({ received: true });
}
```

### 3.5 AI System Prompt

```typescript
// /lib/ai/prompts.ts

export function buildSystemPrompt(project: Project): string {
  return `You are a skilled fiction author writing in the ${project.genre || 'general fiction'} genre.

## Your Role
You are "The Scribe" - an AI writing assistant that transforms narrative beats (high-level instructions) into polished prose. You maintain perfect consistency with the established story world.

## Writing Guidelines
- Write in ${project.settings?.povStyle || 'third person limited'} point of view
- Target audience: ${project.settings?.targetAudience || 'adult'} readers
- Tone keywords to embody: ${project.settings?.toneKeywords?.join(', ') || 'engaging, immersive'}
- Avoid: ${project.settings?.avoidKeywords?.join(', ') || 'purple prose, info-dumping'}

## Critical Rules
1. **Consistency is paramount**: Never contradict established facts from the knowledge graph
2. **Show, don't tell**: Use action, dialogue, and sensory details
3. **Character voice**: Each character should have distinct speech patterns and mannerisms
4. **Pacing**: Match the pacing implied by the beat instructions
5. **Scene endings**: End scenes at natural transition points unless instructed otherwise

## Output Format
Write the scene prose directly. Do not include meta-commentary, headers, or explanations unless specifically requested.`;
}

export function buildGenerationPrompt(
  context: SceneContext,
  beatInstructions: string,
  options?: GenerationOptions
): string {
  return `## Story Context

### World: ${context.project.title}
${context.project.description || ''}

### Book: ${context.book.title} (${context.book.status})
${context.book.synopsis || ''}

### Current Chapter: ${context.chapter.title}
${context.chapter.summary || 'No summary yet'}

---

## Knowledge Graph (Active Elements)
${context.subgraph}

---

## Previous Context

### Recent Scenes in This Chapter
${context.previousScenes || 'This is the first scene in the chapter.'}

### Earlier Chapter Summaries
${context.previousChapters || 'This is the first chapter.'}

---

## Current Scene: ${context.scene.title}

**Location**: ${context.scene.location?.name || 'Unspecified'}
**Time**: ${context.scene.time_of_day || 'Unspecified'}
**Characters Present**: ${context.scene.characters?.map((c: any) => c.character.name).join(', ') || 'None specified'}

---

## Beat Instructions (Your Directive)
${beatInstructions}

---

${options?.additionalInstructions || ''}

Write the scene now. Aim for approximately ${options?.targetWordCount || 800} words.`;
}
```

### 3.6 Environment Variables

```bash
# .env.local (Vercel)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID=price_...

# App
NEXT_PUBLIC_APP_URL=https://storyforge.ai
```

---

## 4. UI/UX Specifications

### 4.1 Page Layouts

#### Dashboard (Projects List)
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] StoryForge          [Search]    [+ New Project] [👤]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Your Universes                                    [Grid|List]
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ 🖼 Cover │  │ 🖼 Cover │  │    +     │                  │
│  │          │  │          │  │   New    │                  │
│  │ Fantasy  │  │ Sci-Fi   │  │ Project  │                  │
│  │ World    │  │ Universe │  │          │                  │
│  │ 3 books  │  │ 1 book   │  │          │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Project Home (World Bible + Books)
```
┌─────────────────────────────────────────────────────────────┐
│  [←] Projects / Fantasy World                    [⚙ Settings]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  [📊 Graph] [📚 Books] [📝 Notes]                     │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  WORLD GRAPH                               [+ Add Entity]   │
│  ┌─────────────────────────────────────────────────────────┐
│  │                                                         │
│  │    [Alice]────loves────[Bob]                           │
│  │       │                  │                              │
│  │    works_at          born_in                           │
│  │       ↓                  ↓                              │
│  │   [Castle]          [The Shire]                        │
│  │                                                         │
│  └─────────────────────────────────────────────────────────┘
│                                                             │
│  BOOKS IN THIS UNIVERSE                    [+ New Book]     │
│  ┌────────────┐  ┌────────────┐                            │
│  │ Book 1     │  │ Book 2     │                            │
│  │ Drafting   │  │ Planning   │                            │
│  │ 45,000 w   │  │ 0 w        │                            │
│  └────────────┘  └────────────┘                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Scene Editor (Split Pane)
```
┌─────────────────────────────────────────────────────────────┐
│  Fantasy World > Book 1 > Ch 3 > Scene 2      [Save] [Gen]  │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────┬────────────────────────────────────┐│
│  │ THE DIRECTOR       │ THE SCRIBE                         ││
│  │                    │                                    ││
│  │ Beat Instructions: │ Generated/Edited Prose:            ││
│  │                    │                                    ││
│  │ Alice confronts    │ The throne room fell silent as     ││
│  │ Bob about the      │ Alice's footsteps echoed across    ││
│  │ betrayal. She's    │ the marble floor. Bob sat rigid    ││
│  │ furious but tries  │ upon the gilded throne, his        ││
│  │ to stay composed.  │ knuckles white against the...      ││
│  │ Bob is defensive   │                                    ││
│  │ but guilty.        │                                    ││
│  │                    │                                    ││
│  │ [💡 Suggestions]   │                      [1,247 words] ││
│  ├────────────────────┴────────────────────────────────────┤│
│  │ CONTEXT INSPECTOR                                       ││
│  │ 📍 Location: Throne Room  👥 Alice (POV), Bob          ││
│  │ 🔗 Active: Alice→hates→Bob (9), Alice→works_at→Castle  ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Component Library (shadcn/ui)

Required components to install:
```bash
npx shadcn@latest init
npx shadcn@latest add button card dialog dropdown-menu input label 
npx shadcn@latest add select sheet sidebar skeleton tabs textarea toast
npx shadcn@latest add avatar badge breadcrumb command context-menu
npx shadcn@latest add form popover progress scroll-area separator
npx shadcn@latest add resizable tooltip
```

### 4.3 Key Interactions

| Action | Behavior |
|--------|----------|
| Create Node | Opens slide-over panel with form |
| Create Edge | Drag from node handle to another node |
| Generate Scene | POST to API, stream response into editor |
| Auto-save | Debounced save every 3 seconds after edit |
| Version History | Slide-over showing previous versions |
| Export Book | Opens modal with format selection |

---

## 5. Development Phases

### Phase 1: Foundation (Week 1-2)
**Goal:** Deployable skeleton with auth

- [ ] Initialize Next.js 14 with TypeScript
- [ ] Configure Tailwind + shadcn/ui
- [ ] Set up Supabase project
- [ ] Run database migrations
- [ ] Implement Supabase Auth (email + Google)
- [ ] Create protected layout with middleware
- [ ] Build basic dashboard shell
- [ ] Deploy to Vercel

**Deliverable:** User can sign up, see empty dashboard

### Phase 2: Data Model (Week 2-3)
**Goal:** Full CRUD for hierarchy + graph

- [ ] Generate TypeScript types from Supabase
- [ ] Implement Projects CRUD
- [ ] Implement Books CRUD
- [ ] Implement Chapters CRUD
- [ ] Implement Scenes CRUD
- [ ] Implement Story Nodes CRUD
- [ ] Implement Story Edges CRUD
- [ ] Build React Query hooks for all entities
- [ ] Add Zustand store for UI state

**Deliverable:** User can create full project structure

### Phase 3: Graph Visualization (Week 3-4)
**Goal:** Interactive knowledge graph

- [ ] Integrate React Flow
- [ ] Build custom node components by type
- [ ] Implement edge creation via drag
- [ ] Add node editing panel
- [ ] Implement graph layout algorithms
- [ ] Add zoom/pan controls
- [ ] Build mini-map for navigation

**Deliverable:** User can visually build story world

### Phase 4: Editor (Week 4-5)
**Goal:** Functional writing environment

- [ ] Integrate Tiptap editor
- [ ] Build split-pane layout (beats | prose)
- [ ] Implement scene character selection
- [ ] Implement location selection
- [ ] Build context inspector panel
- [ ] Add word count display
- [ ] Implement auto-save with debounce
- [ ] Add version history viewer

**Deliverable:** User can write and edit scenes

### Phase 5: AI Integration (Week 5-6)
**Goal:** Intelligent generation

- [ ] Set up Anthropic API integration
- [ ] Build context builder (graph → text)
- [ ] Implement `generate-scene` endpoint
- [ ] Add streaming response handling
- [ ] Build quota checking logic
- [ ] Implement generation logging
- [ ] Add "regenerate" functionality
- [ ] Build vectorization endpoint for semantic search

**Deliverable:** AI generates contextual prose

### Phase 6: Payments (Week 6-7)
**Goal:** Monetization

- [ ] Create Stripe products and prices
- [ ] Implement checkout session creation
- [ ] Build webhook handler
- [ ] Create billing portal integration
- [ ] Add subscription status UI
- [ ] Implement usage metering
- [ ] Add upgrade prompts

**Deliverable:** Users can subscribe and limits are enforced

### Phase 7: Polish (Week 7-8)
**Goal:** Production-ready

- [ ] Implement book export (DOCX, EPUB)
- [ ] Add onboarding flow
- [ ] Build settings pages
- [ ] Add keyboard shortcuts
- [ ] Implement search (projects, nodes)
- [ ] Add loading states and skeletons
- [ ] Error boundaries and error handling
- [ ] Mobile responsiveness
- [ ] Performance optimization
- [ ] Sentry error tracking

**Deliverable:** Launch-ready application

---

## 6. Success Metrics

| Metric | Target (Month 1) | Target (Month 6) |
|--------|------------------|------------------|
| Registered Users | 500 | 5,000 |
| Pro Subscribers | 25 (5%) | 500 (10%) |
| MRR | $375 | $7,500 |
| Avg. Sessions/User/Week | 3 | 5 |
| Avg. Words Generated/User | 2,000 | 10,000 |
| Churn Rate | - | < 8% |

---

## 7. Future Enhancements (Post-MVP)

1. **Real-time Collaboration** - Multiple authors editing same project
2. **AI Character Chat** - Have conversations with your characters
3. **Plot Timeline View** - Visual timeline of events across books
4. **Writing Analytics** - Pace tracking, consistency scores
5. **Publishing Integration** - Direct export to KDP, Draft2Digital
6. **Mobile App** - React Native companion for writing on the go
7. **Community Features** - Share world bibles, writing prompts
8. **Fine-tuned Models** - Custom models trained on user's style

---

## 8. Appendix

### A. Node Type Schemas

```typescript
// Character
interface CharacterProperties {
  age?: number;
  occupation?: string;
  traits: string[];
  physicalDescription?: string;
  backstory?: string;
  goals?: string;
  fears?: string;
  speechPatterns?: string;
  relationships?: string; // Summary of key relationships
}

// Location
interface LocationProperties {
  type: 'city' | 'building' | 'room' | 'natural' | 'other';
  atmosphere?: string;
  climate?: string;
  population?: string;
  significantHistory?: string;
  sensoryDetails?: {
    sights?: string;
    sounds?: string;
    smells?: string;
  };
}

// Item
interface ItemProperties {
  type: 'weapon' | 'artifact' | 'document' | 'vehicle' | 'other';
  appearance?: string;
  abilities?: string;
  history?: string;
  currentLocation?: string;
}

// Event
interface EventProperties {
  date?: string; // In-world date
  duration?: string;
  participants?: string[];
  outcome?: string;
  significance?: string;
}

// Faction
interface FactionProperties {
  type: 'government' | 'organization' | 'family' | 'species' | 'other';
  size?: string;
  goals?: string;
  structure?: string;
  headquarters?: string;
  rivals?: string[];
  allies?: string[];
}

// Concept
interface ConceptProperties {
  category: 'magic_system' | 'technology' | 'religion' | 'culture' | 'other';
  rules?: string[];
  limitations?: string[];
  history?: string;
}
```

### B. Relationship Types (Suggested)

```typescript
const RELATIONSHIP_TYPES = {
  // Character → Character
  personal: ['loves', 'hates', 'fears', 'trusts', 'distrusts', 'respects', 'rivals'],
  familial: ['parent_of', 'child_of', 'sibling_of', 'spouse_of', 'ancestor_of'],
  professional: ['employs', 'works_for', 'mentors', 'apprentice_of', 'commands'],
  
  // Character → Location
  spatial: ['lives_in', 'works_at', 'born_in', 'died_in', 'visits', 'rules'],
  
  // Character → Faction
  membership: ['member_of', 'leads', 'founded', 'betrayed', 'opposes'],
  
  // Character → Item
  possession: ['owns', 'created', 'seeks', 'guards', 'destroyed'],
  
  // Location → Location
  geography: ['contains', 'borders', 'connected_to', 'part_of'],
  
  // Event → *
  temporal: ['caused_by', 'led_to', 'occurred_at', 'involved'],
  
  // Generic
  generic: ['related_to', 'references', 'influences']
};
```

### C. Error Codes

| Code | Meaning | User Message |
|------|---------|--------------|
| `quota_exceeded` | Monthly word limit reached | "You've reached your monthly limit. Upgrade to Pro for unlimited generation." |
| `node_limit` | Free tier node limit | "Free accounts are limited to 50 story elements. Upgrade to add more." |
| `project_limit` | Free tier project limit | "Upgrade to Pro to create multiple universes." |
| `generation_failed` | AI API error | "Generation failed. Please try again." |
| `context_too_large` | Token limit exceeded | "Your story context is very large. Try focusing on fewer characters." |
