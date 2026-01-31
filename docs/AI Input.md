1. Generate Outline (/api/ai/generate-outline)
Context Gathered:
Source	Data
Project	Title, genre, description
Book	Title, subtitle, synopsis
Writing Style	POV, tense, prose style, pacing, content rating, tone
Story Nodes	Characters (name, description, role), Locations, Factions, Events, Items
Story Edges	Relationships between nodes (source → type → target)
System Prompt Structure:
# Story Universe
## Project: {title}
Genre: {genre}
World: {description}

## Book: {title}
Synopsis: {synopsis}

### Writing Style
POV: {pov_style}
Tense: {tense}
...

## Characters
- {name}: {description} ({role})

## Locations
## Factions
## Events
## Items

## Key Relationships
- {source} {relationship_type} {target}

## Guidelines for Outline Generation
1. Structure, 2. Pacing, 3. Characters, 4. Locations, 5. Consistency, 6. Beat Instructions
2. Generate Scene (/api/ai/generate-scene)
Context Gathered (most comprehensive):
Source	Data
Project	Title, genre, world setting, time period, themes, target audience, narrative conventions
Book	Title, synopsis, all style settings (POV, tense, prose style, pacing, dialogue style, content rating, violence/romance levels, tone)
Chapter	Title, summary
Scene	Title, time in story
Characters	POV character first, then others by depth - includes name, role, description, arc, attributes, tags
Relationships	Character relationships with descriptions and timeline validity
Location	Primary location + hierarchy
Factions	Names, descriptions, faction relationships
Events	Related events with dates and involved characters (up to 5)
Previous Scenes	Last 2 from current chapter + last from previous chapter (excerpts)
Chapter Summaries	Last 3 chapters
Series Context	Previous books' synopses (if series)
Graph Traversal:
Uses get_connected_subgraph RPC to traverse 2 levels deep from focus nodes (scene characters + location)
Respects timeline validity of relationships
Dynamic Guidelines Generated:
Based on book settings, adds specific writing instructions like:
POV instructions (first person, third limited, etc.)
Tense (past/present)
Prose style (sparse, literary, commercial, etc.)
Pacing (fast, slow, variable)
Content rating guidelines
3. Edit Prose (/api/ai/edit-prose)
Context Gathered (minimal):
Source	Data
Selected Text	The user-selected text to edit
Action	One of: shorten, expand, rewrite, show_dont_tell, dialogue, intensify, soften, continue, fix, custom
Custom Prompt	(if action is "custom")
System Prompt:
You are a skilled fiction editor helping a novelist refine their prose.

Guidelines:
- Maintain the author's voice and style
- Keep the same POV and tense
- Preserve character names and important details
- Output ONLY the edited text
- Match approximate length unless asked otherwise
Action-Specific Prompts:
Each action has its own tailored prompt (e.g., "Make this text more concise..." for shorten)
Summary Comparison
Feature	Context Depth	Token Usage (Est.)
Generate Outline	Medium	~2-4K tokens
Generate Scene	High (full graph)	~3-8K tokens
Edit Prose	Low (just selection)	~0.5-2K tokens
Recommendation:
The Edit Prose feature currently doesn't include any scene/book context. This could be enhanced to include writing style settings (POV, tense, prose style) for more consistent edits that match the book's voic