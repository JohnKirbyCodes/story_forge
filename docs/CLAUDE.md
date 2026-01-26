# CLAUDE.md - StoryForge AI Project Context

## Project Overview
StoryForge AI is a professional-grade, AI-assisted novel writing platform. The core differentiator is a **Knowledge Graph Architecture** where stories are modeled as connected graphs of Nodes (Characters, Locations, Events) and Edges (Relationships).

**Key Concept - Series Architecture:** A "Project" contains a fictional universe (World Bible). Within a Project, users create multiple "Books" that share the same context graph.

## Tech Stack (Non-Negotiable)
- **Framework:** Next.js 14 (App Router) with TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL + Auth + Storage + pgvector)
- **AI:** Anthropic Claude API via Vercel AI SDK
- **Payments:** Stripe (Subscriptions)
- **Graph Visualization:** React Flow
- **Rich Text Editor:** Tiptap
- **State:** TanStack Query (server) + Zustand (client)
- **Deployment:** Vercel

## Project Structure
```
storyforge/
├── app/
│   ├── (auth)/login, signup, callback
│   ├── (dashboard)/
│   │   ├── page.tsx                    # Projects list
│   │   ├── projects/[projectId]/       # Project home
│   │   │   ├── graph/                  # Graph editor
│   │   │   └── books/[bookId]/         # Book outline
│   │   │       └── editor/[sceneId]/   # Scene editor
│   │   └── settings/                   # Account + billing
│   └── api/ai/, stripe/, export/, vectorize/
├── components/ui/, editor/, graph/, dashboard/, shared/
├── lib/supabase/, stripe/, ai/, graph/, utils/
├── hooks/
├── stores/
├── types/
└── supabase/migrations/
```

## Data Model Hierarchy
```
Project (Universe/World)
  ├── Story Nodes (Characters, Locations, Items, Events, Factions, Concepts)
  ├── Story Edges (Relationships between nodes)
  └── Books (Manuscripts)
        └── Parts (Optional divisions)
              └── Chapters
                    └── Scenes
                          ├── beat_instructions (user input)
                          ├── generated_prose (AI output)
                          ├── edited_prose (user edits)
                          └── scene_characters (M2M to nodes)
```

## Key Database Tables
- `profiles` - User accounts + Stripe billing
- `projects` - Universe containers
- `books` - Manuscripts within projects
- `chapters` - Book divisions
- `scenes` - Actual content with beats + prose
- `story_nodes` - Graph entities (with vector embeddings)
- `story_edges` - Relationships (with timeline validity)
- `scene_characters` - M2M linking scenes to character nodes

## Critical Implementation Notes

### Authentication
- Use Supabase Auth with email + Google OAuth
- Protect all `/dashboard` routes via middleware
- Create profile on signup via database trigger or auth callback

### Row Level Security
ALL tables must have RLS enabled. Policy pattern:
- `profiles`: `auth.uid() = id`
- `projects`: `auth.uid() = user_id`
- Child tables: Join up to projects and check `user_id = auth.uid()`

### AI Generation Flow
1. User writes "beats" (high-level instructions) in left pane
2. System gathers context: connected graph nodes, previous scenes, chapter summaries
3. POST to `/api/ai/generate-scene` with sceneId + beats
4. Stream response using Vercel AI SDK
5. Display in right pane (Tiptap editor)
6. Log usage and update word count quota

### Graph Context Building
Use recursive CTE to traverse graph from "focus nodes" (active characters + location):
```sql
SELECT * FROM get_connected_subgraph(project_id, focus_node_ids[], depth, current_book_id)
```
Convert result to structured text for AI prompt.

### Stripe Integration
- Free: 1 project, 1 book, 50 nodes, 5k words/month
- Pro ($15/mo): Unlimited
- Webhook events: checkout.session.completed, subscription.updated/deleted

## Commands Reference
```bash
# Dev
npm run dev

# Database
npx supabase db push          # Apply migrations
npx supabase gen types ts     # Generate TypeScript types

# Components
npx shadcn@latest add [component]
```

## Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
NEXT_PUBLIC_APP_URL
```

## Current Phase
**[UPDATE THIS AS YOU PROGRESS]**
Phase: 3 - Core Features Complete
Status: Dashboard, Editor, Graph, AI Generation, and Stripe Billing implemented
