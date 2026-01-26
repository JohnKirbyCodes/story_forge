# StoryForge AI - Claude Code Prompt Chain

## How to Use This Document

1. **Start a new Claude Code session** with the project directory
2. **Ensure CLAUDE.md is in your project root** - Claude Code reads this automatically
3. **Run prompts in order** - Each phase builds on the previous
4. **Verify checkpoint before proceeding** - Don't skip ahead
5. **Update CLAUDE.md** after each phase to track progress

---

## Pre-Flight Checklist

Before starting, ensure you have:
- [ ] Supabase project created (note URL and keys)
- [ ] Stripe account with test mode enabled
- [ ] Anthropic API key
- [ ] Vercel account linked to GitHub
- [ ] Empty GitHub repo created

---

## PHASE 1: Project Scaffold & Authentication

### Prompt 1.1 - Initialize Project

```
Initialize a new Next.js 14 project with the App Router for StoryForge AI.

Requirements:
1. Create the project with: npx create-next-app@latest storyforge --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"

2. Install core dependencies:
   - @supabase/supabase-js @supabase/ssr
   - @tanstack/react-query
   - zustand
   - stripe @stripe/stripe-js
   - @anthropic-ai/sdk ai (Vercel AI SDK)
   - reactflow
   - @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
   - lucide-react
   - date-fns
   - zod

3. Initialize shadcn/ui and add these components:
   button, card, dialog, dropdown-menu, input, label, select, sheet, 
   sidebar, skeleton, tabs, textarea, toast, avatar, badge, breadcrumb,
   form, popover, separator, resizable, tooltip, scroll-area

4. Create the folder structure as defined in CLAUDE.md

5. Set up the environment variables file (.env.local.example) with all required vars

6. Configure TypeScript in strict mode

Don't implement any features yet - just the scaffold.
```

### Prompt 1.2 - Supabase Auth Setup

```
Set up Supabase authentication for StoryForge.

Requirements:
1. Create lib/supabase/client.ts - Browser client using createBrowserClient
2. Create lib/supabase/server.ts - Server client using createServerClient with cookies
3. Create lib/supabase/admin.ts - Admin client with service role key (for webhooks)
4. Create lib/supabase/middleware.ts - Helper for middleware auth checks

5. Create middleware.ts in project root that:
   - Refreshes auth tokens
   - Protects all /dashboard/* routes
   - Redirects unauthenticated users to /login
   - Redirects authenticated users from /login to /dashboard

6. Create auth pages:
   - app/(auth)/login/page.tsx - Email + Google OAuth login
   - app/(auth)/signup/page.tsx - Registration form
   - app/(auth)/callback/route.ts - OAuth callback handler

7. Use shadcn components for forms. Include loading states and error handling.

Reference the Supabase SSR docs for Next.js App Router patterns.
```

### Prompt 1.3 - Dashboard Shell

```
Create the authenticated dashboard layout for StoryForge.

Requirements:
1. app/(dashboard)/layout.tsx with:
   - Collapsible sidebar using shadcn Sidebar component
   - Sidebar items: Projects, Settings, Help
   - Header with user avatar dropdown (Settings, Billing, Sign Out)
   - Sign out should call supabase.auth.signOut() and redirect

2. app/(dashboard)/page.tsx - Empty state for now with "Your Universes" heading

3. Create components/shared/LoadingSpinner.tsx
4. Create components/shared/ErrorBoundary.tsx (React error boundary)

5. Set up TanStack Query provider in app/layout.tsx

6. Create a useUser hook in hooks/useUser.ts that:
   - Gets current session from Supabase
   - Returns user, loading, error states
```

### Checkpoint 1 Verification

```
Verify Phase 1 is complete:

1. Run `npm run dev` - should start without errors
2. Visit /login - should see login form
3. Sign up with email - should redirect to /dashboard
4. Visit /dashboard when logged out - should redirect to /login
5. Sidebar should be visible and collapsible
6. Sign out should work and redirect to home

List any issues found.
```

---

## PHASE 2: Database Schema & Types

### Prompt 2.1 - Database Migration

```
Create the Supabase database schema for StoryForge.

I'm providing the complete SQL migration. Create the file:
supabase/migrations/001_initial_schema.sql

[PASTE THE ENTIRE SQL SCHEMA FROM THE PRD HERE]

After creating the file, explain:
1. How to apply this migration to Supabase
2. How to generate TypeScript types
3. Any manual steps needed in Supabase dashboard (like enabling extensions)
```

### Prompt 2.2 - TypeScript Types

```
Set up TypeScript types for the StoryForge database.

Requirements:
1. Create types/database.ts with the generated Supabase types
   (I'll paste the output from `supabase gen types typescript`)

2. Create types/graph.ts with:
   - NodeType enum matching the database enum
   - CharacterProperties, LocationProperties, ItemProperties, etc. interfaces
   - StoryNode and StoryEdge types extending database types
   - SubgraphResult type for the graph query function

3. Create types/editor.ts with:
   - SceneContext type (what we pass to AI)
   - GenerationOptions type
   - EditorState type for Zustand store

4. Create types/index.ts that re-exports everything
```

### Prompt 2.3 - Data Hooks (Projects & Books)

```
Create React Query hooks for Projects and Books CRUD operations.

Requirements:
1. hooks/useProjects.ts:
   - useProjects() - list all user's projects
   - useProject(id) - single project with books count
   - useCreateProject() - mutation
   - useUpdateProject() - mutation
   - useDeleteProject() - mutation
   - useArchiveProject() - mutation

2. hooks/useBooks.ts:
   - useBooks(projectId) - list books in project
   - useBook(id) - single book with chapters
   - useCreateBook() - mutation
   - useUpdateBook() - mutation
   - useDeleteBook() - mutation
   - useReorderBooks() - mutation for drag-drop

Use proper TypeScript types. Include optimistic updates where appropriate.
Invalidate related queries on mutations.
```

### Prompt 2.4 - Data Hooks (Chapters & Scenes)

```
Create React Query hooks for Chapters and Scenes.

Requirements:
1. hooks/useChapters.ts:
   - useChapters(bookId) - list chapters with scene count
   - useChapter(id) - single chapter with scenes
   - useCreateChapter() - mutation
   - useUpdateChapter() - mutation  
   - useDeleteChapter() - mutation
   - useReorderChapters() - mutation

2. hooks/useScenes.ts:
   - useScenes(chapterId) - list scenes in order
   - useScene(id) - single scene with all relations (location, characters)
   - useCreateScene() - mutation
   - useUpdateScene() - mutation (handles both prose and beat updates)
   - useDeleteScene() - mutation
   - useReorderScenes() - mutation

3. hooks/useSceneCharacters.ts:
   - useAddCharacterToScene() - mutation
   - useRemoveCharacterFromScene() - mutation
   - useUpdateCharacterRole() - mutation

Include proper loading and error states.
```

### Checkpoint 2 Verification

```
Verify Phase 2 is complete:

1. Check Supabase dashboard - all tables should exist with correct columns
2. RLS should be enabled on all tables
3. Create a test project via Supabase dashboard SQL editor
4. The TypeScript types should compile without errors
5. Hooks should be importable without errors

Run: npx tsc --noEmit

List any type errors or issues.
```

---

## PHASE 3: Graph System

### Prompt 3.1 - Graph Data Hooks

```
Create React Query hooks for the Knowledge Graph (Story Nodes and Edges).

Requirements:
1. hooks/useGraph.ts:
   - useNodes(projectId) - all nodes in project
   - useNodesByType(projectId, type) - filtered by type
   - useNode(id) - single node with connected edges
   - useCreateNode() - mutation
   - useUpdateNode() - mutation (including position for React Flow)
   - useDeleteNode() - mutation (soft delete for characters)
   - useBulkUpdateNodePositions() - for saving React Flow layout

2. hooks/useEdges.ts:
   - useEdges(projectId) - all edges
   - useEdgesBetweenNodes(nodeId1, nodeId2) - specific relationship
   - useCreateEdge() - mutation
   - useUpdateEdge() - mutation
   - useDeleteEdge() - mutation

3. hooks/useGraphTraversal.ts:
   - useConnectedSubgraph(projectId, focusNodeIds, depth, bookId)
     Calls the get_connected_subgraph RPC function
   - useSemanticSearch(projectId, query)
     Will be implemented later with vectorization
```

### Prompt 3.2 - React Flow Graph Canvas

```
Build the interactive graph visualization using React Flow.

Requirements:
1. components/graph/GraphCanvas.tsx:
   - Full React Flow implementation
   - Receives nodes and edges from useGraph hooks
   - Custom node component based on node type (different icons/colors)
   - Handle connection (edge creation) events
   - Handle node position changes with debounced save
   - Mini-map in corner
   - Controls (zoom, fit view)

2. components/graph/CustomNode.tsx:
   - Styled node component
   - Icon based on node type (User for character, MapPin for location, etc.)
   - Node name displayed
   - Colored border based on type
   - Source and target handles for connections

3. components/graph/NodePanel.tsx:
   - Slide-over panel for viewing/editing a node
   - Dynamic form fields based on node type
   - Uses the property schemas from types/graph.ts
   - Save and delete buttons

4. components/graph/EdgePanel.tsx:
   - Panel for editing edge properties
   - Label, description, weight (1-10 slider)
   - Bidirectional toggle
   - Timeline validity (which books)

Use shadcn Sheet for panels. Support keyboard shortcuts (Delete to remove selected).
```

### Prompt 3.3 - Graph Page Integration

```
Integrate the graph visualization into the project page.

Requirements:
1. app/(dashboard)/projects/[projectId]/page.tsx:
   - Tabs: "Graph" | "Books" | "Settings"
   - Graph tab shows GraphCanvas full width
   - Books tab shows book cards grid
   - "Add Entity" button opens type selector then NodePanel

2. app/(dashboard)/projects/[projectId]/graph/page.tsx:
   - Full-screen graph editor (for focused work)
   - Toolbar with: Add Node dropdown, Zoom controls, Layout button
   - Node type filter checkboxes

3. Create a "New Node" flow:
   - User clicks Add → selects type → NodePanel opens in create mode
   - On save, node appears at center of viewport

4. Create edge creation flow:
   - User drags from node handle to another node
   - EdgePanel opens to set relationship details
   - On save, edge appears with label
```

### Checkpoint 3 Verification

```
Verify Phase 3 is complete:

1. Navigate to a project page
2. Add a Character node - should appear on canvas
3. Add a Location node
4. Drag from Character to Location - should prompt for relationship
5. Create edge with label "lives_in"
6. Edge should display with label
7. Click node → panel should open with editable fields
8. Drag nodes around → positions should persist after refresh
9. Mini-map should show overview

Test edge cases: delete node with edges, duplicate names.
List any issues.
```

---

## PHASE 4: Book & Chapter Management

### Prompt 4.1 - Projects Dashboard

```
Build the main projects dashboard.

Requirements:
1. app/(dashboard)/page.tsx:
   - Grid of project cards
   - Each card shows: cover image (or placeholder), title, genre, book count
   - "New Project" card that opens creation dialog
   - Click card → navigate to /projects/[id]

2. components/dashboard/ProjectCard.tsx:
   - Hover state with subtle lift
   - Dropdown menu (three dots): Edit, Archive, Delete
   - Badge showing number of books

3. components/dashboard/CreateProjectDialog.tsx:
   - Form: title, description, genre (select), target audience, POV style
   - Cover image upload (optional, store in Supabase Storage)

4. Empty state when no projects:
   - Illustration or icon
   - "Create your first universe" CTA
```

### Prompt 4.2 - Book Management

```
Build the book management interface within a project.

Requirements:
1. Update app/(dashboard)/projects/[projectId]/page.tsx Books tab:
   - Grid of book cards showing: title, status badge, word count, order number
   - "New Book" card
   - Drag-drop reordering of books (use dnd-kit or similar)

2. components/dashboard/BookCard.tsx:
   - Status indicator (planning/drafting/revising/completed)
   - Progress bar if target_word_count is set
   - Click → navigate to /projects/[projectId]/books/[bookId]

3. components/dashboard/CreateBookDialog.tsx:
   - Form: title, subtitle, synopsis, target word count, status

4. app/(dashboard)/projects/[projectId]/books/[bookId]/page.tsx:
   - Breadcrumb: Project > Book
   - Book header with title, synopsis, word count
   - Chapter list below
```

### Prompt 4.3 - Chapter & Scene Outline

```
Build the chapter and scene management within a book.

Requirements:
1. components/dashboard/ChapterList.tsx:
   - Accordion-style list of chapters
   - Each chapter expands to show scenes
   - Drag-drop reorder for both chapters and scenes
   - Inline "Add Chapter" button
   - Per-chapter "Add Scene" button

2. components/dashboard/ChapterItem.tsx:
   - Title, scene count, total word count
   - Edit button (opens dialog)
   - POV character selector (dropdown of character nodes)

3. components/dashboard/SceneItem.tsx:
   - Title, status badge, word count
   - Click → navigate to editor
   - Quick actions: duplicate, delete

4. Create flow for adding chapters and scenes:
   - Chapter: just needs title initially
   - Scene: title and order_index

5. Keyboard shortcuts:
   - 'n' to add new scene to selected chapter
   - 'Enter' on scene to open editor
```

### Checkpoint 4 Verification

```
Verify Phase 4 is complete:

1. Dashboard shows project cards in grid
2. Create new project → appears in grid
3. Click project → see books tab
4. Create new book → appears in list
5. Click book → see chapter outline
6. Add chapter → expands in accordion
7. Add scene to chapter → appears in list
8. Click scene → navigates to editor URL (page can be empty)
9. Drag-drop reorder works for books, chapters, and scenes
10. Word counts display and update

List any issues.
```

---

## PHASE 5: The Editor

### Prompt 5.1 - Editor Layout

```
Build the main scene editor with split-pane layout.

Requirements:
1. app/(dashboard)/projects/[projectId]/books/[bookId]/editor/[sceneId]/page.tsx:
   - Fetch scene data with useScene hook
   - Full-height layout (calc(100vh - header))
   - Resizable split pane (shadcn Resizable)
   - Left: Beat instructions (textarea or simple editor)
   - Right: Prose (Tiptap)
   - Bottom collapsible: Context Inspector

2. components/editor/SceneHeader.tsx:
   - Breadcrumb navigation
   - Scene title (editable inline)
   - Status dropdown
   - "Generate" button (prominent)
   - "Save" indicator (auto-save status)
   - Word count

3. Create stores/editorStore.ts (Zustand):
   - currentSceneId
   - beatInstructions (local state before save)
   - proseContent (local state)
   - isDirty flag
   - isGenerating flag
   - Actions: setBeat, setProse, markClean, etc.
```

### Prompt 5.2 - Tiptap Editor Integration

```
Integrate Tiptap as the prose editor.

Requirements:
1. components/editor/TiptapEditor.tsx:
   - Tiptap editor with StarterKit
   - Placeholder extension ("Start writing or generate from your beats...")
   - Character count extension
   - Read initial content from scene.edited_prose || scene.generated_prose
   - Bubble menu for formatting (bold, italic, etc.)
   - Emit onChange with debounce for auto-save

2. components/editor/BeatPanel.tsx:
   - Textarea for beat instructions
   - Character guide showing who's in scene
   - Location indicator
   - "Suggestions" section (future: AI-generated beat ideas)

3. Implement auto-save:
   - Debounce prose changes (3 seconds)
   - Call useUpdateScene mutation
   - Show "Saving..." / "Saved" indicator
   - Create version entry in scene_versions table

4. Handle prose vs edited distinction:
   - generated_prose: AI output (never manually edited)
   - edited_prose: User's version (if they edit after generation)
   - Display edited_prose if exists, else generated_prose
```

### Prompt 5.3 - Context Inspector

```
Build the context inspector panel for the editor.

Requirements:
1. components/editor/ContextInspector.tsx:
   - Collapsible bottom panel
   - Three sections: Location, Characters, Relationships

2. Location section:
   - Dropdown to select location from project's location nodes
   - Shows location summary when selected
   - "Time of day" selector

3. Characters section:
   - Multi-select to add characters to scene
   - Each character shows: name, role dropdown (POV, major, minor, mentioned)
   - One character can be marked as POV

4. Relationships section:
   - Auto-populated based on selected characters
   - Shows edges between active characters
   - Format: "Alice hates Bob (weight: 9)"

5. "Active Context" summary:
   - Text preview of what will be sent to AI
   - Expandable to see full context
   - Helps user understand what AI "knows"
```

### Checkpoint 5 Verification

```
Verify Phase 5 is complete:

1. Navigate to a scene in the editor
2. Split pane should be resizable
3. Type in beat instructions → should save (check isDirty state)
4. Type in Tiptap editor → auto-save after 3 seconds
5. Refresh page → content persists
6. Select location from dropdown → updates scene
7. Add characters to scene → appear in inspector
8. Set one character as POV → only one can be POV
9. Relationships section shows edges between characters
10. Word count updates as you type

List any issues.
```

---

## PHASE 6: AI Generation

### Prompt 6.1 - Context Builder

```
Build the AI context assembly system.

Requirements:
1. lib/ai/context-builder.ts:
   - buildSceneContext(supabase, sceneId) function that:
     a. Fetches scene with all relations
     b. Gets connected subgraph for active nodes (location + characters)
     c. Gets previous 2 scenes in chapter (for continuity)
     d. Gets previous 3 chapter summaries in book
     e. Returns structured SceneContext object

2. lib/ai/prompts.ts:
   - buildSystemPrompt(project) - writer persona based on genre/settings
   - buildGenerationPrompt(context, beats, options) - full prompt with:
     * World overview
     * Active knowledge graph (formatted as readable text)
     * Previous context
     * Current scene setup
     * Beat instructions
     * Target word count

3. Helper function: formatSubgraphForPrompt(nodes)
   - Groups nodes by type
   - Lists each node with summary and relationships
   - Output should be human-readable markdown-ish text

Reference the example implementations in the PRD.
```

### Prompt 6.2 - Generation API Route

```
Build the AI generation endpoint.

Requirements:
1. app/api/ai/generate-scene/route.ts:
   - POST handler with streaming response
   - Verify user authentication
   - Check user quota (word_count_usage vs limit based on subscription)
   - Build context using buildSceneContext
   - Call Anthropic API via Vercel AI SDK streamText
   - Use claude-sonnet-4-20250514 model
   - On completion:
     * Save generated_prose to scene
     * Log to ai_generation_log
     * Update user's word_count_usage
   - Return streaming response

2. lib/ai/billing.ts:
   - checkUserQuota(userId, estimatedWords) 
     Returns { allowed: boolean, remaining: number, message?: string }
   - logGeneration(userId, sceneId, metadata)
   - getUsageStats(userId) for dashboard display

3. Error handling:
   - 402 for quota exceeded
   - 401 for unauthenticated
   - 500 for AI API errors (with user-friendly message)
```

### Prompt 6.3 - Frontend Generation Integration

```
Connect the editor to the AI generation endpoint.

Requirements:
1. hooks/useGeneration.ts:
   - useGenerateScene() mutation that:
     * POSTs to /api/ai/generate-scene
     * Handles streaming response
     * Updates Zustand store as chunks arrive
     * Shows progress in UI

2. Update components/editor/TiptapEditor.tsx:
   - Accept streaming content
   - Append chunks as they arrive
   - Smooth scroll to keep latest text visible
   - Disable editing during generation

3. Update SceneHeader.tsx:
   - Generate button shows loading state during generation
   - Disable if no beat instructions
   - Show error toast if generation fails
   - Show success toast with word count on completion

4. Handle generation states in editorStore:
   - isGenerating: boolean
   - generationProgress: 'idle' | 'building_context' | 'generating' | 'saving'
   - generationError: string | null

5. Add keyboard shortcut: Cmd/Ctrl+Enter to generate
```

### Prompt 6.4 - Vectorization (Semantic Search)

```
Implement node vectorization for semantic search.

Requirements:
1. app/api/vectorize/route.ts:
   - POST handler accepting { nodeId }
   - Build text representation of node (name + summary + properties)
   - Call Anthropic embeddings API (or OpenAI if preferred)
   - Save embedding to story_nodes.embedding column
   - Return success

2. Trigger vectorization:
   - When node is created (after initial save)
   - When node summary is updated
   - Use React Query's onSuccess callback

3. lib/ai/semantic-search.ts:
   - searchNodes(projectId, query, limit) function
   - Creates embedding for query
   - Calls search_nodes_by_embedding RPC
   - Returns ranked results

4. Future use: When generating, also search for semantically relevant nodes
   that weren't explicitly linked to the scene.
```

### Checkpoint 6 Verification

```
Verify Phase 6 is complete:

1. Add beat instructions to a scene
2. Add characters and location
3. Click Generate
4. Text should stream into the prose editor
5. Word count should update in real-time
6. After completion, word_count_usage should increase in profiles table
7. ai_generation_log should have new entry
8. generated_prose column should be populated
9. Edit the text → edited_prose should be used on next load
10. Test quota: set word_count_usage high → should get 402 error

Test with complex graph (5+ connected nodes) to verify context building.
List any issues.
```

---

## PHASE 7: Payments (Stripe)

### Prompt 7.1 - Stripe Setup

```
Set up Stripe integration for StoryForge.

Requirements:
1. Create products in Stripe Dashboard (or via API):
   - Free (no product needed, just default state)
   - Pro Author: $15/month recurring
   - Team Author: $39/month recurring (optional for MVP)

2. lib/stripe/client.ts:
   - Initialize Stripe with secret key
   - Helper functions for common operations

3. lib/stripe/config.ts:
   - PLANS object mapping subscription_status to limits:
     ```typescript
     export const PLANS = {
       free: { projects: 1, booksPerProject: 1, nodes: 50, wordsPerMonth: 5000 },
       pro: { projects: -1, booksPerProject: -1, nodes: -1, wordsPerMonth: 100000 },
       team: { projects: -1, booksPerProject: -1, nodes: -1, wordsPerMonth: 500000 }
     }
     ```
   - Helper: getPlanLimits(status)
   - Helper: checkLimit(status, limitType, currentValue)
```

### Prompt 7.2 - Checkout & Portal

```
Implement Stripe Checkout and Customer Portal.

Requirements:
1. app/api/stripe/checkout/route.ts:
   - POST handler
   - Create Stripe Checkout session
   - Set success_url and cancel_url
   - Pass userId in metadata
   - If user has stripe_customer_id, use it
   - Otherwise, create new customer

2. app/api/stripe/portal/route.ts:
   - POST handler
   - Create Customer Portal session
   - Redirect to portal for managing subscription

3. app/(dashboard)/settings/billing/page.tsx:
   - Show current plan
   - Show usage (words this month)
   - Show renewal date if subscribed
   - "Upgrade to Pro" button → calls checkout API
   - "Manage Subscription" button → calls portal API

4. components/dashboard/UpgradePrompt.tsx:
   - Reusable component for limit-reached scenarios
   - Shows which limit was hit
   - CTA to upgrade
```

### Prompt 7.3 - Webhook Handler

```
Implement Stripe webhook handler.

Requirements:
1. app/api/stripe/webhook/route.ts:
   - Verify webhook signature
   - Handle events:
     * checkout.session.completed → set subscription_status to 'pro'
     * customer.subscription.updated → update status and period_end
     * customer.subscription.deleted → set status to 'free'
     * invoice.payment_failed → set status to 'past_due'

2. Use admin Supabase client (service role) since webhooks are server-to-server

3. Add proper error handling and logging

4. Test with Stripe CLI:
   stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Prompt 7.4 - Limit Enforcement

```
Enforce subscription limits throughout the app.

Requirements:
1. hooks/useSubscription.ts:
   - useSubscription() hook that returns:
     * status, limits, usage, isLoading
     * canCreateProject(), canCreateBook(), canAddNode(), canGenerate()
     * Helper methods that return { allowed, message }

2. Update project creation:
   - Check canCreateProject() before showing form
   - Show UpgradePrompt if limit reached

3. Update node creation:
   - Check canAddNode() before allowing
   - Show count: "45/50 story elements"

4. Update generation:
   - Already handled in API, but show warning in UI when approaching limit
   - "You have 500 words remaining this month"

5. Add usage reset:
   - Cron job or Supabase function to reset word_count_usage monthly
   - Check word_count_reset_at and reset if > 1 month ago
```

### Checkpoint 7 Verification

```
Verify Phase 7 is complete:

1. Go to Settings > Billing
2. Click "Upgrade to Pro" → should redirect to Stripe Checkout
3. Complete test payment (use 4242424242424242)
4. Webhook should fire → subscription_status should be 'pro'
5. Return to app → should show Pro status
6. Click "Manage Subscription" → should open Stripe Portal
7. Cancel subscription in portal
8. Webhook should fire → status should be 'free' or 'canceled'
9. Create nodes until limit → should show upgrade prompt
10. Check word generation with limits

Use Stripe test mode throughout. List any issues.
```

---

## PHASE 8: Polish & Launch Prep

### Prompt 8.1 - Export Functionality

```
Implement book export to DOCX format.

Requirements:
1. Install docx package: npm install docx

2. app/api/export/[bookId]/route.ts:
   - GET handler with format query param
   - Verify user owns book
   - Fetch all chapters and scenes in order
   - Generate DOCX with:
     * Title page (book title, author)
     * Table of contents
     * Chapters with headings
     * Scene breaks (###)
   - Upload to Supabase Storage
   - Create exports table entry
   - Return download URL

3. components/dashboard/ExportDialog.tsx:
   - Format selector (DOCX for now, EPUB/PDF future)
   - Include options: title page, TOC, scene breaks
   - Progress indicator
   - Download button when ready

4. Free tier: TXT only
   Pro tier: DOCX, EPUB, PDF
```

### Prompt 8.2 - Onboarding Flow

```
Create an onboarding flow for new users.

Requirements:
1. Detect first-time user (no projects)

2. components/onboarding/OnboardingWizard.tsx:
   - Step 1: Welcome + explain the concept
   - Step 2: Create first project (guided form)
   - Step 3: Add first character node
   - Step 4: Add first location node
   - Step 5: Create first book
   - Step 6: Create first chapter and scene
   - Step 7: Quick tour of editor

3. Use shadcn Dialog with progress dots

4. Store onboarding_completed in profiles.preferences

5. "Skip" option available at any step
```

### Prompt 8.3 - Search & Navigation

```
Add global search and improved navigation.

Requirements:
1. components/shared/GlobalSearch.tsx:
   - Command palette (Cmd+K)
   - Search projects, books, chapters, scenes, nodes
   - Recent items section
   - Quick actions: New Project, New Book, etc.

2. Keyboard shortcuts:
   - Cmd+K: Global search
   - Cmd+S: Save current scene
   - Cmd+Enter: Generate (in editor)
   - Escape: Close panels/dialogs
   - ?: Show keyboard shortcuts help

3. components/shared/Breadcrumbs.tsx:
   - Clickable path: Project > Book > Chapter > Scene
   - Dropdown on each level for quick switching

4. Add "Recent" section to sidebar:
   - Last 5 accessed scenes
   - Click to jump directly to editor
```

### Prompt 8.4 - Error Handling & Loading States

```
Add comprehensive error handling and loading states.

Requirements:
1. Create error boundary that:
   - Catches render errors
   - Shows friendly error message
   - "Try again" and "Go home" buttons
   - Reports to console (Sentry integration later)

2. Add loading skeletons for:
   - Project cards grid
   - Book list
   - Chapter accordion
   - Graph canvas
   - Editor panes

3. Add empty states for:
   - No projects
   - No books in project
   - No chapters in book
   - No nodes in graph

4. Toast notifications for:
   - Save success/failure
   - Generation complete/failed
   - Export ready
   - Subscription changes

5. Offline handling:
   - Detect offline state
   - Show banner
   - Queue saves for when online
```

### Prompt 8.5 - Mobile Responsiveness

```
Make the app responsive for tablet/mobile viewing.

Requirements:
1. Dashboard:
   - Single column card grid on mobile
   - Collapsible sidebar becomes bottom nav or hamburger

2. Project page:
   - Tabs stack vertically on mobile
   - Graph: touch-friendly zoom/pan, larger touch targets

3. Editor:
   - Stack panes vertically on mobile (beats above prose)
   - Context inspector as slide-up sheet
   - Simplified toolbar

4. Test breakpoints:
   - sm: 640px (large phones)
   - md: 768px (tablets)
   - lg: 1024px (small laptops)
   - xl: 1280px+ (desktops)

5. Touch interactions:
   - Tap-to-select nodes
   - Long-press for context menu
   - Swipe to navigate between scenes
```

### Final Checkpoint

```
Comprehensive verification before launch:

FUNCTIONALITY:
[ ] User can sign up, log in, log out
[ ] User can CRUD projects, books, chapters, scenes
[ ] User can CRUD nodes and edges in graph
[ ] Graph visualization works with drag/drop
[ ] Editor loads with correct content
[ ] Auto-save works reliably
[ ] AI generation streams correctly
[ ] Context includes relevant graph data
[ ] Stripe checkout and portal work
[ ] Webhooks update subscription status
[ ] Limits are enforced correctly
[ ] Export generates downloadable file

QUALITY:
[ ] No TypeScript errors (npx tsc --noEmit)
[ ] No console errors in browser
[ ] Loading states for all async operations
[ ] Error handling for all failure modes
[ ] Mobile responsive (test on phone)
[ ] Keyboard shortcuts work

SECURITY:
[ ] RLS enabled on all tables
[ ] API routes check authentication
[ ] Webhook signature verified
[ ] No sensitive data in client bundle

PERFORMANCE:
[ ] Initial load < 3 seconds
[ ] Page navigations feel instant
[ ] Graph handles 100+ nodes smoothly
[ ] No memory leaks (check with DevTools)

List all issues found and fix before deploying.
```

---

## Deployment Checklist

```
Final deployment steps:

1. Environment Variables in Vercel:
   - Add all from .env.local
   - Ensure NEXT_PUBLIC_ vars are set

2. Supabase:
   - Run production migrations
   - Enable email confirmations if desired
   - Set up custom domain (optional)

3. Stripe:
   - Switch to live mode keys
   - Update webhook endpoint to production URL
   - Test with real card (small amount)

4. Vercel:
   - Connect GitHub repo
   - Set production branch
   - Enable preview deployments

5. Domain:
   - Point domain to Vercel
   - Enable HTTPS

6. Monitoring:
   - Set up Sentry (optional)
   - Enable Vercel Analytics
   - Set up uptime monitoring

7. Launch:
   - Test full user flow on production
   - Monitor for errors
   - Have rollback plan ready
```

---

## Troubleshooting Common Issues

### "RLS policy blocked access"
- Check that auth.uid() matches expected user
- Verify the join chain in child table policies
- Use Supabase SQL editor to debug with specific UUIDs

### "Streaming not working"
- Ensure API route has `export const runtime = 'edge'`
- Check that Vercel AI SDK is returning `.toDataStreamResponse()`
- Verify client is using the SDK's streaming hooks

### "Graph too slow with many nodes"
- Add LIMIT to initial query
- Implement viewport culling (only render visible nodes)
- Use Web Workers for layout calculations

### "Stripe webhook failing"
- Verify webhook secret matches
- Check raw body is passed to constructEvent
- Ensure endpoint is publicly accessible
- Use Stripe CLI for local testing
