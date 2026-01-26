# Story Universe Schema Reference

This document defines the complete schema for StoryForge's Story Universe system, including node types, attributes, relationship types, and book/series metadata.

---

## Table of Contents

1. [Node Types & Attributes](#node-types--attributes)
2. [Character Roles](#character-roles)
3. [Relationship Types](#relationship-types)
4. [Book-Level Metadata](#book-level-metadata)
5. [Project-Level Metadata](#project-level-metadata)
6. [Scene-Level Metadata](#scene-level-metadata)

---

## Node Types & Attributes

The `story_nodes.attributes` JSONB field stores type-specific attributes. Below are the recommended attributes for each node type.

### Character

| Attribute | Type | Description |
|-----------|------|-------------|
| `full_name` | string | Full legal/formal name |
| `aliases` | string[] | Nicknames, titles, pseudonyms |
| `date_of_birth` | string | In-story birth date |
| `date_of_death` | string | In-story death date (if applicable) |
| `age` | number | Current age in story |
| `gender` | string | Gender identity |
| `pronouns` | string | Preferred pronouns |
| `species` | string | Human, elf, AI, etc. |
| `nationality` | string | Country/region of origin |
| `ethnicity` | string | Ethnic background |
| `occupation` | string | Current job/role |
| `social_class` | string | Economic/social standing |
| **Physical** | | |
| `height` | string | Height description |
| `build` | string | Body type (athletic, slim, etc.) |
| `hair_color` | string | Hair color |
| `hair_style` | string | Hair style/length |
| `eye_color` | string | Eye color |
| `skin_tone` | string | Skin color/complexion |
| `distinguishing_features` | string[] | Scars, tattoos, birthmarks |
| `clothing_style` | string | Typical attire |
| `voice` | string | Voice description |
| **Personality** | | |
| `personality_traits` | string[] | Core traits (brave, cynical, etc.) |
| `strengths` | string[] | Positive qualities |
| `flaws` | string[] | Weaknesses/negative traits |
| `fears` | string[] | Phobias, deep fears |
| `desires` | string[] | Goals, wants, motivations |
| `values` | string[] | Core beliefs, morals |
| `quirks` | string[] | Habits, mannerisms |
| `speech_patterns` | string | How they talk |
| **Background** | | |
| `backstory` | string | Character history |
| `secrets` | string[] | Hidden information |
| `skills` | string[] | Abilities, expertise |
| `education` | string | Educational background |
| `languages` | string[] | Languages spoken |
| **Story Role** | | |
| `motivation` | string | What drives them in the story |
| `internal_conflict` | string | Inner struggle |
| `external_conflict` | string | External obstacles |
| `arc_summary` | string | Character growth trajectory |
| `first_appearance` | string | When introduced |

### Location

| Attribute | Type | Description |
|-----------|------|-------------|
| `location_subtype` | string | city, building, room, wilderness, planet, etc. |
| `climate` | string | Weather/climate conditions |
| `terrain` | string | Physical landscape |
| `population` | string | Number/type of inhabitants |
| `government` | string | Ruling system |
| `economy` | string | Economic system/industries |
| `culture` | string | Cultural characteristics |
| `language` | string | Primary language spoken |
| `architecture` | string | Building/design style |
| `technology_level` | string | Tech advancement |
| `magic_level` | string | Magic prevalence |
| `atmosphere` | string | Mood/feeling of place |
| `sounds` | string[] | Typical sounds |
| `smells` | string[] | Typical smells |
| `dangers` | string[] | Hazards, threats |
| `resources` | string[] | Notable resources |
| `history` | string | Historical background |
| `secrets` | string[] | Hidden aspects |
| `coordinates` | object | { lat, lng } or fantasy coordinates |
| `parent_location` | string | Containing location name |

### Event

| Attribute | Type | Description |
|-----------|------|-------------|
| `event_type` | string | battle, meeting, ceremony, disaster, etc. |
| `start_date` | string | When event begins |
| `end_date` | string | When event ends |
| `duration` | string | How long it lasts |
| `location_name` | string | Where it occurs |
| `participants` | string[] | Who's involved |
| `outcome` | string | Result/conclusion |
| `consequences` | string[] | Long-term effects |
| `causes` | string[] | What led to this |
| `public_knowledge` | boolean | Is this known to all? |
| `historical_significance` | string | Why it matters |
| `witnesses` | string[] | Who saw it happen |
| `casualties` | string | Deaths/injuries |
| `artifacts_involved` | string[] | Important items |

### Item

| Attribute | Type | Description |
|-----------|------|-------------|
| `item_type` | string | weapon, artifact, document, clothing, etc. |
| `material` | string | What it's made of |
| `size` | string | Dimensions/scale |
| `weight` | string | How heavy |
| `color` | string | Appearance |
| `condition` | string | State of repair |
| `age` | string | How old |
| `origin` | string | Where/how it was made |
| `creator` | string | Who made it |
| `previous_owners` | string[] | Ownership history |
| `current_owner` | string | Who has it now |
| `location` | string | Where it's kept |
| `powers` | string[] | Magical/special abilities |
| `value` | string | Monetary/sentimental worth |
| `rarity` | string | How common/rare |
| `history` | string | Notable events involving it |
| `curse` | string | Negative effects |
| `requirements` | string[] | Conditions to use |
| `weaknesses` | string[] | How it can be destroyed/countered |

### Faction

| Attribute | Type | Description |
|-----------|------|-------------|
| `faction_type` | string | government, guild, religion, military, etc. |
| `founding_date` | string | When established |
| `founder` | string | Who created it |
| `headquarters` | string | Main base location |
| `territory` | string[] | Areas controlled |
| `size` | string | Number of members |
| `structure` | string | Organizational hierarchy |
| `leadership` | string[] | Current leaders |
| `goals` | string[] | Objectives |
| `methods` | string[] | How they operate |
| `ideology` | string | Core beliefs |
| `symbols` | string[] | Emblems, flags, colors |
| `motto` | string | Slogan/creed |
| `rituals` | string[] | Ceremonies, traditions |
| `ranks` | string[] | Member hierarchy |
| `requirements` | string[] | Membership criteria |
| `resources` | string[] | Assets, wealth |
| `allies` | string[] | Allied factions |
| `enemies` | string[] | Opposing factions |
| `secrets` | string[] | Hidden information |
| `reputation` | string | Public perception |

### Concept

| Attribute | Type | Description |
|-----------|------|-------------|
| `concept_type` | string | magic_system, technology, religion, culture, law, etc. |
| `origin` | string | Where it came from |
| `practitioners` | string[] | Who uses/follows it |
| `rules` | string[] | Governing principles |
| `limitations` | string[] | Restrictions, costs |
| `manifestations` | string[] | How it appears |
| `history` | string | Development over time |
| `public_knowledge` | boolean | Is this widely known? |
| `related_concepts` | string[] | Connected ideas |
| `symbols` | string[] | Associated imagery |
| `terminology` | object | Key terms and definitions |
| `examples` | string[] | Specific instances |

---

## Character Roles

The `story_nodes.character_role` field defines a character's narrative function. These can be set at the project level (universe-wide) or overridden per book.

### Primary Roles

| Role | Description |
|------|-------------|
| `protagonist` | Main character driving the story |
| `antagonist` | Primary opposition to protagonist |
| `deuteragonist` | Secondary protagonist / close partner |
| `tritagonist` | Third most important character |

### Supporting Roles

| Role | Description |
|------|-------------|
| `love_interest` | Romantic interest of protagonist |
| `mentor` | Guide/teacher figure |
| `ally` | Supporting character helping protagonist |
| `rival` | Competition (not necessarily evil) |
| `foil` | Character contrasting with protagonist |
| `confidant` | Character protagonist confides in |

### Functional Roles

| Role | Description |
|------|-------------|
| `comic_relief` | Provides humor/lightness |
| `herald` | Announces change/calls to adventure |
| `threshold_guardian` | Tests protagonist at key moments |
| `shapeshifter` | Loyalty/allegiance unclear |
| `trickster` | Disrupts status quo |
| `tempter` | Tries to lead protagonist astray |

### Minor Roles

| Role | Description |
|------|-------------|
| `supporting` | Named character with recurring role |
| `minor` | Named character with small role |
| `extra` | Background/walk-on character |
| `mentioned` | Referenced but never appears |

### Book-Scoped Roles

For series where character roles change between books, use `book_characters` junction table:

```typescript
interface BookCharacter {
  book_id: string;
  node_id: string;
  role_in_book: CharacterRole;
  is_pov_character: boolean;
  introduction_chapter_id?: string;
}
```

---

## Relationship Types

The `story_edges.relationship_type` field defines how nodes are connected. Relationships are categorized by the node types they connect.

### Character ↔ Character

#### Family
| Type | Bidirectional | Description |
|------|--------------|-------------|
| `parent_of` | No | Parent → Child |
| `child_of` | No | Child → Parent |
| `sibling_of` | Yes | Brother/Sister |
| `spouse_of` | Yes | Married partners |
| `engaged_to` | Yes | Engaged to marry |
| `divorced_from` | Yes | Former spouses |
| `ancestor_of` | No | Grandparent+ → Descendant |
| `descendant_of` | No | Descendant → Ancestor |
| `guardian_of` | No | Legal guardian → Ward |
| `adopted_by` | No | Adoptee → Adopter |

#### Romantic
| Type | Bidirectional | Description |
|------|--------------|-------------|
| `loves` | No | Romantic love (may be unrequited) |
| `attracted_to` | No | Physical/romantic attraction |
| `dating` | Yes | In romantic relationship |
| `ex_partner_of` | Yes | Former romantic partners |
| `affair_with` | Yes | Illicit relationship |
| `pining_for` | No | Unrequited longing |

#### Social
| Type | Bidirectional | Description |
|------|--------------|-------------|
| `friend_of` | Yes | Friends |
| `best_friend_of` | Yes | Close friends |
| `acquaintance_of` | Yes | Casual acquaintance |
| `enemy_of` | Yes | Personal enemies |
| `rival_of` | Yes | Competitors |
| `nemesis_of` | Yes | Arch-enemy |
| `respects` | No | Holds in high regard |
| `fears` | No | Afraid of |
| `trusts` | No | Places trust in |
| `distrusts` | No | Suspicious of |
| `hates` | No | Strong dislike |
| `admires` | No | Looks up to |
| `jealous_of` | No | Envies |
| `protects` | No | Guards/defends |

#### Professional
| Type | Bidirectional | Description |
|------|--------------|-------------|
| `mentor_of` | No | Teacher → Student |
| `student_of` | No | Student → Teacher |
| `employer_of` | No | Boss → Employee |
| `employee_of` | No | Employee → Boss |
| `colleague_of` | Yes | Coworkers |
| `partner_of` | Yes | Business/work partners |
| `subordinate_of` | No | Reports to |
| `commands` | No | Has authority over |
| `apprentice_of` | No | Training under |

#### Narrative
| Type | Bidirectional | Description |
|------|--------------|-------------|
| `saved_by` | No | Life saved by |
| `betrayed_by` | No | Betrayed by |
| `murdered_by` | No | Killed by |
| `created_by` | No | Brought into existence by |
| `transformed_by` | No | Changed fundamentally by |
| `bound_to` | Yes | Magically/spiritually linked |
| `sworn_to` | No | Oath of loyalty |
| `indebted_to` | No | Owes a debt |
| `manipulates` | No | Controls/uses |

### Character ↔ Location

| Type | Description |
|------|-------------|
| `lives_in` | Primary residence |
| `works_at` | Place of employment |
| `born_in` | Birthplace |
| `died_in` | Place of death |
| `owns` | Property owner |
| `rules` | Governs/controls |
| `frequents` | Regularly visits |
| `visited` | Has been to |
| `banished_from` | Exiled from |
| `imprisoned_in` | Held captive |
| `hiding_in` | Secret refuge |
| `seeks` | Searching for |
| `discovered` | Found/explored |

### Character ↔ Faction

| Type | Description |
|------|-------------|
| `member_of` | Active member |
| `leader_of` | Heads the faction |
| `founded` | Created the faction |
| `joined` | Became a member |
| `left` | Departed from |
| `exiled_from` | Kicked out |
| `spy_in` | Secret infiltrator |
| `ally_of` | Supports (non-member) |
| `enemy_of` | Opposes |
| `serves` | Works for |
| `worships` | Religious devotion (for religions) |

### Character ↔ Item

| Type | Description |
|------|-------------|
| `owns` | Legal possession |
| `possesses` | Currently has |
| `wields` | Actively uses (weapons) |
| `wears` | Currently wearing |
| `created` | Made the item |
| `destroyed` | Destroyed the item |
| `seeks` | Looking for |
| `guards` | Protects |
| `stole` | Took illegally |
| `inherited` | Received as inheritance |
| `lost` | No longer has |
| `gifted` | Gave to someone |
| `bound_to` | Magically linked |
| `cursed_by` | Afflicted by |

### Character ↔ Event

| Type | Description |
|------|-------------|
| `participated_in` | Took part |
| `caused` | Directly responsible |
| `witnessed` | Saw it happen |
| `died_in` | Killed during |
| `born_during` | Born at time of |
| `survived` | Lived through |
| `fled_from` | Escaped from |
| `prevented` | Stopped from happening |
| `remembered_for` | Famous for role in |

### Location ↔ Location

| Type | Description |
|------|-------------|
| `contains` | Parent → Child location |
| `part_of` | Child → Parent location |
| `adjacent_to` | Next to (bidirectional) |
| `connected_to` | Linked by path/road |
| `borders` | Shares border with |
| `across_from` | Opposite side |
| `visible_from` | Can be seen from |
| `leads_to` | Path/door goes to |
| `teleports_to` | Magical connection |

### Location ↔ Event

| Type | Description |
|------|-------------|
| `site_of` | Where event occurred |
| `destroyed_by` | Damaged/destroyed in event |
| `created_by` | Built/formed during event |
| `transformed_by` | Changed by event |

### Location ↔ Faction

| Type | Description |
|------|-------------|
| `headquarters_of` | Main base |
| `controlled_by` | Under faction's power |
| `contested_by` | Multiple factions fighting for |
| `sacred_to` | Holy site for |
| `founded_by` | Established by faction |

### Faction ↔ Faction

| Type | Description |
|------|-------------|
| `allied_with` | Formal alliance (bidirectional) |
| `at_war_with` | Military conflict (bidirectional) |
| `rival_of` | Competing (bidirectional) |
| `parent_of` | Spawned/created |
| `splinter_of` | Broke off from |
| `absorbed` | Took over |
| `vassal_of` | Subordinate to |
| `trades_with` | Commercial relationship |

### Item ↔ Event

| Type | Description |
|------|-------------|
| `used_in` | Employed during event |
| `created_in` | Made during event |
| `destroyed_in` | Lost during event |
| `discovered_in` | Found during event |
| `key_to` | Essential for event |

### Item ↔ Location

| Type | Description |
|------|-------------|
| `stored_in` | Kept at location |
| `hidden_in` | Secretly placed |
| `found_in` | Discovered at |
| `lost_in` | Disappeared at |
| `created_in` | Made at location |

### Concept ↔ Any

| Type | Description |
|------|-------------|
| `governs` | Rules/controls |
| `practiced_by` | Used/followed by |
| `originated_in` | Started at location |
| `created_by` | Invented/discovered by |
| `opposes` | Conflicts with (concept) |
| `derived_from` | Based on (concept) |
| `enables` | Makes possible |
| `restricts` | Limits/controls |

---

## Book-Level Metadata

Fields to add to the `books` table for AI generation guidance.

### Narrative Voice

| Field | Type | Values |
|-------|------|--------|
| `pov_style` | enum | `first_person`, `third_limited`, `third_omniscient`, `second_person`, `multiple_pov` |
| `pov_character_ids` | uuid[] | Characters providing POV (for multiple_pov) |
| `tense` | enum | `past`, `present` |

### Writing Style

| Field | Type | Values |
|-------|------|--------|
| `prose_style` | enum | `literary`, `commercial`, `sparse`, `ornate`, `conversational` |
| `pacing` | enum | `fast`, `moderate`, `slow`, `varied` |
| `dialogue_style` | text | "Witty banter", "Formal", "Regional dialects" |
| `description_density` | enum | `minimal`, `moderate`, `rich` |

### Structure

| Field | Type | Values |
|-------|------|--------|
| `chapter_structure` | enum | `titled`, `numbered`, `pov_named`, `date_stamped` |
| `avg_chapter_length` | enum | `short` (1-2k), `medium` (3-5k), `long` (6k+) |
| `includes_prologue` | boolean | Has prologue |
| `includes_epilogue` | boolean | Has epilogue |

### Content Guidelines

| Field | Type | Values |
|-------|------|--------|
| `content_rating` | enum | `G`, `PG`, `PG-13`, `R`, `Adult` |
| `violence_level` | enum | `none`, `mild`, `moderate`, `graphic` |
| `romance_level` | enum | `none`, `fade_to_black`, `moderate`, `explicit` |
| `profanity_level` | enum | `none`, `mild`, `moderate`, `strong` |
| `sensitive_topics` | text[] | Topics requiring careful handling |

### Tone

| Field | Type | Values |
|-------|------|--------|
| `tone` | text[] | `dark`, `hopeful`, `comedic`, `tragic`, `epic`, `intimate`, `suspenseful`, `whimsical`, `gritty`, `romantic` |
| `mood` | text | Overall emotional atmosphere |

---

## Project-Level Metadata

Fields to add to the `projects` table for series-wide settings.

### World Settings

| Field | Type | Description |
|-------|------|-------------|
| `tone` | text[] | Overall series tone |
| `themes` | text[] | (existing) Major themes |
| `subgenres` | text[] | "Epic Fantasy", "Cozy Mystery" |
| `target_audience` | enum | `middle_grade`, `young_adult`, `new_adult`, `adult` |
| `content_rating` | enum | Default rating for series |

### Universe Rules

| Field | Type | Description |
|-------|------|-------------|
| `world_rules` | text | Magic system rules, tech limits |
| `narrative_conventions` | text[] | "No deus ex machina", "Characters can die" |
| `timeline_type` | enum | `linear`, `nonlinear`, `parallel`, `circular` |
| `magic_system_type` | enum | `hard`, `soft`, `none` |
| `technology_era` | text | Medieval, Modern, Futuristic, etc. |

### Series Structure

| Field | Type | Description |
|-------|------|-------------|
| `series_type` | enum | `standalone`, `duology`, `trilogy`, `series`, `open_ended` |
| `planned_books` | number | Expected number of books |
| `overarching_plot` | text | Series-wide story arc |

---

## Scene-Level Metadata

Fields on the `scenes` table for per-scene AI guidance.

| Field | Type | Description |
|-------|------|-------------|
| `pov_character_id` | uuid | (existing) Whose POV |
| `location_id` | uuid | (existing) Where it takes place |
| `time_in_story` | text | (existing) When in story timeline |
| `scene_type` | enum | `action`, `dialogue`, `introspection`, `exposition`, `transition`, `flashback` |
| `emotional_arc` | enum | `rising`, `falling`, `climax`, `resolution`, `flat` |
| `tension_level` | enum | `low`, `medium`, `high`, `peak` |
| `time_of_day` | enum | `dawn`, `morning`, `afternoon`, `evening`, `night`, `late_night` |
| `weather` | text | Weather conditions |
| `mood` | text | Emotional atmosphere |
| `purpose` | text[] | What this scene accomplishes |

---

## Suggested Database Migration

```sql
-- Book-level metadata
ALTER TABLE books ADD COLUMN IF NOT EXISTS pov_style text
  CHECK (pov_style IN ('first_person', 'third_limited', 'third_omniscient', 'second_person', 'multiple_pov'));
ALTER TABLE books ADD COLUMN IF NOT EXISTS pov_character_ids uuid[];
ALTER TABLE books ADD COLUMN IF NOT EXISTS tense text CHECK (tense IN ('past', 'present'));
ALTER TABLE books ADD COLUMN IF NOT EXISTS prose_style text
  CHECK (prose_style IN ('literary', 'commercial', 'sparse', 'ornate', 'conversational'));
ALTER TABLE books ADD COLUMN IF NOT EXISTS pacing text CHECK (pacing IN ('fast', 'moderate', 'slow', 'varied'));
ALTER TABLE books ADD COLUMN IF NOT EXISTS dialogue_style text;
ALTER TABLE books ADD COLUMN IF NOT EXISTS content_rating text CHECK (content_rating IN ('G', 'PG', 'PG-13', 'R', 'Adult'));
ALTER TABLE books ADD COLUMN IF NOT EXISTS violence_level text CHECK (violence_level IN ('none', 'mild', 'moderate', 'graphic'));
ALTER TABLE books ADD COLUMN IF NOT EXISTS romance_level text CHECK (romance_level IN ('none', 'fade_to_black', 'moderate', 'explicit'));
ALTER TABLE books ADD COLUMN IF NOT EXISTS tone text[];

-- Project-level metadata
ALTER TABLE projects ADD COLUMN IF NOT EXISTS subgenres text[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS target_audience text
  CHECK (target_audience IN ('middle_grade', 'young_adult', 'new_adult', 'adult'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS narrative_conventions text[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS series_type text
  CHECK (series_type IN ('standalone', 'duology', 'trilogy', 'series', 'open_ended'));

-- Scene-level metadata
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS scene_type text
  CHECK (scene_type IN ('action', 'dialogue', 'introspection', 'exposition', 'transition', 'flashback'));
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS tension_level text CHECK (tension_level IN ('low', 'medium', 'high', 'peak'));
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS mood text;

-- Book-character junction for book-scoped roles
CREATE TABLE IF NOT EXISTS book_characters (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  node_id uuid REFERENCES story_nodes(id) ON DELETE CASCADE NOT NULL,
  role_in_book text,
  is_pov_character boolean DEFAULT false,
  introduction_chapter_id uuid REFERENCES chapters(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(book_id, node_id)
);
```

---

## Usage in AI Context

When building context for AI generation, the system should:

1. **Include character attributes** relevant to the scene (physical for visual scenes, personality for dialogue)
2. **Include relationship context** for characters in the scene
3. **Apply book metadata** to system prompt (POV, style, tone)
4. **Apply scene metadata** to guide the specific scene generation
5. **Filter by timeline** using `valid_from_book_id` / `valid_until_book_id` on edges

Example system prompt injection:

```
WRITING STYLE:
- POV: Third-person limited (Marcus's perspective)
- Tense: Past
- Style: Commercial, moderate description density
- Pacing: Fast (action scene)
- Tone: Tense, urgent

CONTENT GUIDELINES:
- Violence: Moderate (combat acceptable, no gore)
- Profanity: Mild
```
