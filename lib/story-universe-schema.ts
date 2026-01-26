/**
 * Story Universe Schema Constants
 * Defines node attributes, relationship types, and metadata options
 */

// ============================================================================
// NODE ATTRIBUTE SCHEMAS
// ============================================================================

export interface AttributeField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'boolean' | 'tags';
  placeholder?: string;
  options?: { value: string; label: string }[];
  group?: string;
}

export const CHARACTER_ATTRIBUTES: AttributeField[] = [
  // Basic Info
  { key: 'full_name', label: 'Full Name', type: 'text', placeholder: 'Full legal/formal name', group: 'Basic' },
  { key: 'aliases', label: 'Aliases', type: 'tags', placeholder: 'Nicknames, titles...', group: 'Basic' },
  { key: 'age', label: 'Age', type: 'text', placeholder: 'Current age', group: 'Basic' },
  { key: 'date_of_birth', label: 'Date of Birth', type: 'text', placeholder: 'In-story date', group: 'Basic' },
  { key: 'gender', label: 'Gender', type: 'text', placeholder: 'Gender identity', group: 'Basic' },
  { key: 'pronouns', label: 'Pronouns', type: 'text', placeholder: 'e.g., she/her', group: 'Basic' },
  { key: 'species', label: 'Species', type: 'text', placeholder: 'Human, elf, etc.', group: 'Basic' },
  { key: 'occupation', label: 'Occupation', type: 'text', placeholder: 'Job/role', group: 'Basic' },

  // Physical
  { key: 'height', label: 'Height', type: 'text', placeholder: 'Height description', group: 'Physical' },
  { key: 'build', label: 'Build', type: 'text', placeholder: 'Body type', group: 'Physical' },
  { key: 'hair_color', label: 'Hair Color', type: 'text', group: 'Physical' },
  { key: 'hair_style', label: 'Hair Style', type: 'text', group: 'Physical' },
  { key: 'eye_color', label: 'Eye Color', type: 'text', group: 'Physical' },
  { key: 'skin_tone', label: 'Skin Tone', type: 'text', group: 'Physical' },
  { key: 'distinguishing_features', label: 'Distinguishing Features', type: 'tags', placeholder: 'Scars, tattoos...', group: 'Physical' },
  { key: 'voice', label: 'Voice', type: 'text', placeholder: 'Voice description', group: 'Physical' },

  // Personality
  { key: 'personality_traits', label: 'Personality Traits', type: 'tags', placeholder: 'Brave, cynical...', group: 'Personality' },
  { key: 'strengths', label: 'Strengths', type: 'tags', group: 'Personality' },
  { key: 'flaws', label: 'Flaws', type: 'tags', group: 'Personality' },
  { key: 'fears', label: 'Fears', type: 'tags', group: 'Personality' },
  { key: 'desires', label: 'Desires', type: 'tags', placeholder: 'Goals, wants...', group: 'Personality' },
  { key: 'values', label: 'Values', type: 'tags', placeholder: 'Core beliefs...', group: 'Personality' },
  { key: 'quirks', label: 'Quirks', type: 'tags', placeholder: 'Habits, mannerisms...', group: 'Personality' },
  { key: 'speech_patterns', label: 'Speech Patterns', type: 'text', placeholder: 'How they talk', group: 'Personality' },

  // Background
  { key: 'backstory', label: 'Backstory', type: 'textarea', placeholder: 'Character history...', group: 'Background' },
  { key: 'secrets', label: 'Secrets', type: 'tags', placeholder: 'Hidden information...', group: 'Background' },
  { key: 'skills', label: 'Skills', type: 'tags', placeholder: 'Abilities, expertise...', group: 'Background' },

  // Story Role
  { key: 'motivation', label: 'Motivation', type: 'textarea', placeholder: 'What drives them...', group: 'Story Role' },
  { key: 'internal_conflict', label: 'Internal Conflict', type: 'textarea', placeholder: 'Inner struggle...', group: 'Story Role' },
  { key: 'external_conflict', label: 'External Conflict', type: 'textarea', placeholder: 'External obstacles...', group: 'Story Role' },
  { key: 'arc_summary', label: 'Character Arc', type: 'textarea', placeholder: 'Growth trajectory...', group: 'Story Role' },
];

export const LOCATION_ATTRIBUTES: AttributeField[] = [
  { key: 'location_subtype', label: 'Type', type: 'select', group: 'Basic', options: [
    { value: 'city', label: 'City' },
    { value: 'town', label: 'Town' },
    { value: 'village', label: 'Village' },
    { value: 'building', label: 'Building' },
    { value: 'room', label: 'Room' },
    { value: 'wilderness', label: 'Wilderness' },
    { value: 'forest', label: 'Forest' },
    { value: 'mountain', label: 'Mountain' },
    { value: 'ocean', label: 'Ocean' },
    { value: 'planet', label: 'Planet' },
    { value: 'ship', label: 'Ship/Vehicle' },
    { value: 'other', label: 'Other' },
  ]},
  { key: 'climate', label: 'Climate', type: 'text', placeholder: 'Weather conditions', group: 'Environment' },
  { key: 'terrain', label: 'Terrain', type: 'text', placeholder: 'Physical landscape', group: 'Environment' },
  { key: 'atmosphere', label: 'Atmosphere', type: 'text', placeholder: 'Mood/feeling', group: 'Environment' },
  { key: 'sounds', label: 'Sounds', type: 'tags', placeholder: 'Typical sounds...', group: 'Sensory' },
  { key: 'smells', label: 'Smells', type: 'tags', placeholder: 'Typical smells...', group: 'Sensory' },
  { key: 'population', label: 'Population', type: 'text', placeholder: 'Number/type of inhabitants', group: 'Details' },
  { key: 'government', label: 'Government', type: 'text', placeholder: 'Ruling system', group: 'Details' },
  { key: 'economy', label: 'Economy', type: 'text', placeholder: 'Economic system', group: 'Details' },
  { key: 'culture', label: 'Culture', type: 'textarea', placeholder: 'Cultural characteristics', group: 'Details' },
  { key: 'architecture', label: 'Architecture', type: 'text', placeholder: 'Building style', group: 'Details' },
  { key: 'dangers', label: 'Dangers', type: 'tags', placeholder: 'Hazards, threats...', group: 'Details' },
  { key: 'resources', label: 'Resources', type: 'tags', placeholder: 'Notable resources...', group: 'Details' },
  { key: 'history', label: 'History', type: 'textarea', placeholder: 'Historical background', group: 'Background' },
  { key: 'secrets', label: 'Secrets', type: 'tags', placeholder: 'Hidden aspects...', group: 'Background' },
];

export const EVENT_ATTRIBUTES: AttributeField[] = [
  { key: 'event_type', label: 'Type', type: 'select', group: 'Basic', options: [
    { value: 'battle', label: 'Battle/War' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'ceremony', label: 'Ceremony' },
    { value: 'disaster', label: 'Disaster' },
    { value: 'discovery', label: 'Discovery' },
    { value: 'death', label: 'Death' },
    { value: 'birth', label: 'Birth' },
    { value: 'treaty', label: 'Treaty/Agreement' },
    { value: 'betrayal', label: 'Betrayal' },
    { value: 'revolution', label: 'Revolution' },
    { value: 'other', label: 'Other' },
  ]},
  { key: 'start_date', label: 'Start Date', type: 'text', placeholder: 'When it begins', group: 'Timeline' },
  { key: 'end_date', label: 'End Date', type: 'text', placeholder: 'When it ends', group: 'Timeline' },
  { key: 'duration', label: 'Duration', type: 'text', placeholder: 'How long', group: 'Timeline' },
  { key: 'location_name', label: 'Location', type: 'text', placeholder: 'Where it occurs', group: 'Details' },
  { key: 'participants', label: 'Participants', type: 'tags', placeholder: "Who's involved", group: 'Details' },
  { key: 'outcome', label: 'Outcome', type: 'textarea', placeholder: 'Result/conclusion', group: 'Details' },
  { key: 'consequences', label: 'Consequences', type: 'tags', placeholder: 'Long-term effects', group: 'Details' },
  { key: 'causes', label: 'Causes', type: 'tags', placeholder: 'What led to this', group: 'Background' },
  { key: 'public_knowledge', label: 'Public Knowledge', type: 'boolean', group: 'Background' },
  { key: 'historical_significance', label: 'Significance', type: 'textarea', placeholder: 'Why it matters', group: 'Background' },
];

export const ITEM_ATTRIBUTES: AttributeField[] = [
  { key: 'item_type', label: 'Type', type: 'select', group: 'Basic', options: [
    { value: 'weapon', label: 'Weapon' },
    { value: 'armor', label: 'Armor' },
    { value: 'artifact', label: 'Artifact' },
    { value: 'document', label: 'Document' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'jewelry', label: 'Jewelry' },
    { value: 'tool', label: 'Tool' },
    { value: 'vehicle', label: 'Vehicle' },
    { value: 'currency', label: 'Currency' },
    { value: 'consumable', label: 'Consumable' },
    { value: 'other', label: 'Other' },
  ]},
  { key: 'material', label: 'Material', type: 'text', placeholder: "What it's made of", group: 'Physical' },
  { key: 'size', label: 'Size', type: 'text', placeholder: 'Dimensions', group: 'Physical' },
  { key: 'color', label: 'Color', type: 'text', placeholder: 'Appearance', group: 'Physical' },
  { key: 'condition', label: 'Condition', type: 'text', placeholder: 'State of repair', group: 'Physical' },
  { key: 'origin', label: 'Origin', type: 'text', placeholder: 'Where/how made', group: 'History' },
  { key: 'creator', label: 'Creator', type: 'text', placeholder: 'Who made it', group: 'History' },
  { key: 'age', label: 'Age', type: 'text', placeholder: 'How old', group: 'History' },
  { key: 'previous_owners', label: 'Previous Owners', type: 'tags', placeholder: 'Ownership history', group: 'History' },
  { key: 'current_owner', label: 'Current Owner', type: 'text', placeholder: 'Who has it now', group: 'History' },
  { key: 'powers', label: 'Powers/Abilities', type: 'tags', placeholder: 'Special abilities', group: 'Properties' },
  { key: 'value', label: 'Value', type: 'text', placeholder: 'Worth', group: 'Properties' },
  { key: 'rarity', label: 'Rarity', type: 'select', group: 'Properties', options: [
    { value: 'common', label: 'Common' },
    { value: 'uncommon', label: 'Uncommon' },
    { value: 'rare', label: 'Rare' },
    { value: 'legendary', label: 'Legendary' },
    { value: 'unique', label: 'Unique' },
  ]},
  { key: 'history', label: 'History', type: 'textarea', placeholder: 'Notable events', group: 'Background' },
];

export const FACTION_ATTRIBUTES: AttributeField[] = [
  { key: 'faction_type', label: 'Type', type: 'select', group: 'Basic', options: [
    { value: 'government', label: 'Government' },
    { value: 'guild', label: 'Guild' },
    { value: 'religion', label: 'Religion' },
    { value: 'military', label: 'Military' },
    { value: 'criminal', label: 'Criminal Organization' },
    { value: 'corporation', label: 'Corporation' },
    { value: 'family', label: 'Noble Family' },
    { value: 'tribe', label: 'Tribe/Clan' },
    { value: 'resistance', label: 'Resistance/Rebellion' },
    { value: 'other', label: 'Other' },
  ]},
  { key: 'founding_date', label: 'Founded', type: 'text', placeholder: 'When established', group: 'Basic' },
  { key: 'founder', label: 'Founder', type: 'text', placeholder: 'Who created it', group: 'Basic' },
  { key: 'headquarters', label: 'Headquarters', type: 'text', placeholder: 'Main base', group: 'Structure' },
  { key: 'size', label: 'Size', type: 'text', placeholder: 'Number of members', group: 'Structure' },
  { key: 'leadership', label: 'Leadership', type: 'tags', placeholder: 'Current leaders', group: 'Structure' },
  { key: 'ranks', label: 'Ranks', type: 'tags', placeholder: 'Member hierarchy', group: 'Structure' },
  { key: 'goals', label: 'Goals', type: 'tags', placeholder: 'Objectives', group: 'Identity' },
  { key: 'methods', label: 'Methods', type: 'tags', placeholder: 'How they operate', group: 'Identity' },
  { key: 'ideology', label: 'Ideology', type: 'textarea', placeholder: 'Core beliefs', group: 'Identity' },
  { key: 'symbols', label: 'Symbols', type: 'tags', placeholder: 'Emblems, colors', group: 'Identity' },
  { key: 'motto', label: 'Motto', type: 'text', placeholder: 'Slogan/creed', group: 'Identity' },
  { key: 'allies', label: 'Allies', type: 'tags', placeholder: 'Allied factions', group: 'Relations' },
  { key: 'enemies', label: 'Enemies', type: 'tags', placeholder: 'Opposing factions', group: 'Relations' },
  { key: 'reputation', label: 'Reputation', type: 'text', placeholder: 'Public perception', group: 'Relations' },
  { key: 'secrets', label: 'Secrets', type: 'tags', placeholder: 'Hidden information', group: 'Background' },
];

export const CONCEPT_ATTRIBUTES: AttributeField[] = [
  { key: 'concept_type', label: 'Type', type: 'select', group: 'Basic', options: [
    { value: 'magic_system', label: 'Magic System' },
    { value: 'technology', label: 'Technology' },
    { value: 'religion', label: 'Religion/Belief' },
    { value: 'culture', label: 'Culture/Custom' },
    { value: 'law', label: 'Law/Rule' },
    { value: 'prophecy', label: 'Prophecy/Legend' },
    { value: 'language', label: 'Language' },
    { value: 'species', label: 'Species/Race' },
    { value: 'other', label: 'Other' },
  ]},
  { key: 'origin', label: 'Origin', type: 'text', placeholder: 'Where it came from', group: 'Basic' },
  { key: 'practitioners', label: 'Practitioners', type: 'tags', placeholder: 'Who uses/follows it', group: 'Details' },
  { key: 'rules', label: 'Rules', type: 'tags', placeholder: 'Governing principles', group: 'Details' },
  { key: 'limitations', label: 'Limitations', type: 'tags', placeholder: 'Restrictions, costs', group: 'Details' },
  { key: 'manifestations', label: 'Manifestations', type: 'tags', placeholder: 'How it appears', group: 'Details' },
  { key: 'history', label: 'History', type: 'textarea', placeholder: 'Development over time', group: 'Background' },
  { key: 'public_knowledge', label: 'Public Knowledge', type: 'boolean', group: 'Background' },
  { key: 'symbols', label: 'Symbols', type: 'tags', placeholder: 'Associated imagery', group: 'Background' },
  { key: 'examples', label: 'Examples', type: 'tags', placeholder: 'Specific instances', group: 'Background' },
];

export const NODE_ATTRIBUTES: Record<string, AttributeField[]> = {
  character: CHARACTER_ATTRIBUTES,
  location: LOCATION_ATTRIBUTES,
  event: EVENT_ATTRIBUTES,
  item: ITEM_ATTRIBUTES,
  faction: FACTION_ATTRIBUTES,
  concept: CONCEPT_ATTRIBUTES,
};

// ============================================================================
// CHARACTER ROLES
// ============================================================================

export const CHARACTER_ROLES = [
  { value: 'protagonist', label: 'Protagonist', description: 'Main character driving the story' },
  { value: 'antagonist', label: 'Antagonist', description: 'Primary opposition' },
  { value: 'deuteragonist', label: 'Deuteragonist', description: 'Secondary protagonist' },
  { value: 'love_interest', label: 'Love Interest', description: 'Romantic interest' },
  { value: 'mentor', label: 'Mentor', description: 'Guide/teacher figure' },
  { value: 'ally', label: 'Ally', description: 'Supporting character' },
  { value: 'rival', label: 'Rival', description: 'Competition (not evil)' },
  { value: 'foil', label: 'Foil', description: 'Contrasts protagonist' },
  { value: 'confidant', label: 'Confidant', description: 'Trusted friend' },
  { value: 'comic_relief', label: 'Comic Relief', description: 'Provides humor' },
  { value: 'supporting', label: 'Supporting', description: 'Named recurring character' },
  { value: 'minor', label: 'Minor', description: 'Small role' },
];

// ============================================================================
// RELATIONSHIP TYPES
// ============================================================================

export interface RelationshipType {
  value: string;
  label: string;
  bidirectional: boolean;
  category: string;
  description?: string;
}

export const RELATIONSHIP_TYPES: Record<string, RelationshipType[]> = {
  'Character-Character': [
    // Family
    { value: 'parent_of', label: 'Parent of', bidirectional: false, category: 'Family' },
    { value: 'child_of', label: 'Child of', bidirectional: false, category: 'Family' },
    { value: 'sibling_of', label: 'Sibling of', bidirectional: true, category: 'Family' },
    { value: 'spouse_of', label: 'Spouse of', bidirectional: true, category: 'Family' },
    { value: 'ancestor_of', label: 'Ancestor of', bidirectional: false, category: 'Family' },
    // Romantic
    { value: 'loves', label: 'Loves', bidirectional: false, category: 'Romantic' },
    { value: 'dating', label: 'Dating', bidirectional: true, category: 'Romantic' },
    { value: 'ex_partner_of', label: 'Ex-Partner of', bidirectional: true, category: 'Romantic' },
    // Social
    { value: 'friend_of', label: 'Friend of', bidirectional: true, category: 'Social' },
    { value: 'enemy_of', label: 'Enemy of', bidirectional: true, category: 'Social' },
    { value: 'rival_of', label: 'Rival of', bidirectional: true, category: 'Social' },
    { value: 'respects', label: 'Respects', bidirectional: false, category: 'Social' },
    { value: 'fears', label: 'Fears', bidirectional: false, category: 'Social' },
    { value: 'trusts', label: 'Trusts', bidirectional: false, category: 'Social' },
    { value: 'distrusts', label: 'Distrusts', bidirectional: false, category: 'Social' },
    // Professional
    { value: 'mentor_of', label: 'Mentor of', bidirectional: false, category: 'Professional' },
    { value: 'student_of', label: 'Student of', bidirectional: false, category: 'Professional' },
    { value: 'employer_of', label: 'Employer of', bidirectional: false, category: 'Professional' },
    { value: 'colleague_of', label: 'Colleague of', bidirectional: true, category: 'Professional' },
    // Narrative
    { value: 'saved_by', label: 'Saved by', bidirectional: false, category: 'Narrative' },
    { value: 'betrayed_by', label: 'Betrayed by', bidirectional: false, category: 'Narrative' },
    { value: 'allied_with', label: 'Allied with', bidirectional: true, category: 'Narrative' },
    { value: 'bound_to', label: 'Bound to', bidirectional: true, category: 'Narrative' },
  ],
  'Character-Location': [
    { value: 'lives_in', label: 'Lives in', bidirectional: false, category: 'Residence' },
    { value: 'works_at', label: 'Works at', bidirectional: false, category: 'Occupation' },
    { value: 'born_in', label: 'Born in', bidirectional: false, category: 'Origin' },
    { value: 'owns', label: 'Owns', bidirectional: false, category: 'Property' },
    { value: 'rules', label: 'Rules', bidirectional: false, category: 'Authority' },
    { value: 'frequents', label: 'Frequents', bidirectional: false, category: 'Visits' },
    { value: 'banished_from', label: 'Banished from', bidirectional: false, category: 'Status' },
    { value: 'hiding_in', label: 'Hiding in', bidirectional: false, category: 'Status' },
  ],
  'Character-Faction': [
    { value: 'member_of', label: 'Member of', bidirectional: false, category: 'Membership' },
    { value: 'leader_of', label: 'Leader of', bidirectional: false, category: 'Leadership' },
    { value: 'founded', label: 'Founded', bidirectional: false, category: 'History' },
    { value: 'left', label: 'Left', bidirectional: false, category: 'Status' },
    { value: 'exiled_from', label: 'Exiled from', bidirectional: false, category: 'Status' },
    { value: 'spy_in', label: 'Spy in', bidirectional: false, category: 'Status' },
    { value: 'serves', label: 'Serves', bidirectional: false, category: 'Role' },
  ],
  'Character-Item': [
    { value: 'owns', label: 'Owns', bidirectional: false, category: 'Possession' },
    { value: 'wields', label: 'Wields', bidirectional: false, category: 'Use' },
    { value: 'created', label: 'Created', bidirectional: false, category: 'Creation' },
    { value: 'seeks', label: 'Seeks', bidirectional: false, category: 'Quest' },
    { value: 'guards', label: 'Guards', bidirectional: false, category: 'Duty' },
    { value: 'bound_to', label: 'Bound to', bidirectional: false, category: 'Magic' },
    { value: 'cursed_by', label: 'Cursed by', bidirectional: false, category: 'Magic' },
  ],
  'Character-Event': [
    { value: 'participated_in', label: 'Participated in', bidirectional: false, category: 'Involvement' },
    { value: 'caused', label: 'Caused', bidirectional: false, category: 'Responsibility' },
    { value: 'witnessed', label: 'Witnessed', bidirectional: false, category: 'Observation' },
    { value: 'died_in', label: 'Died in', bidirectional: false, category: 'Fate' },
    { value: 'survived', label: 'Survived', bidirectional: false, category: 'Fate' },
  ],
  'Location-Location': [
    { value: 'contains', label: 'Contains', bidirectional: false, category: 'Hierarchy' },
    { value: 'part_of', label: 'Part of', bidirectional: false, category: 'Hierarchy' },
    { value: 'adjacent_to', label: 'Adjacent to', bidirectional: true, category: 'Geography' },
    { value: 'connected_to', label: 'Connected to', bidirectional: true, category: 'Geography' },
    { value: 'leads_to', label: 'Leads to', bidirectional: false, category: 'Path' },
  ],
  'Faction-Faction': [
    { value: 'allied_with', label: 'Allied with', bidirectional: true, category: 'Politics' },
    { value: 'at_war_with', label: 'At war with', bidirectional: true, category: 'Conflict' },
    { value: 'rival_of', label: 'Rival of', bidirectional: true, category: 'Competition' },
    { value: 'vassal_of', label: 'Vassal of', bidirectional: false, category: 'Hierarchy' },
    { value: 'trades_with', label: 'Trades with', bidirectional: true, category: 'Commerce' },
  ],
  'General': [
    { value: 'related_to', label: 'Related to', bidirectional: true, category: 'General' },
    { value: 'associated_with', label: 'Associated with', bidirectional: true, category: 'General' },
    { value: 'affects', label: 'Affects', bidirectional: false, category: 'General' },
  ],
};

// Helper to get relationship types for a node pair
export function getRelationshipTypesForPair(sourceType: string, targetType: string): RelationshipType[] {
  const key1 = `${capitalize(sourceType)}-${capitalize(targetType)}`;
  const key2 = `${capitalize(targetType)}-${capitalize(sourceType)}`;

  const types = [
    ...(RELATIONSHIP_TYPES[key1] || []),
    ...(RELATIONSHIP_TYPES[key2] || []),
    ...RELATIONSHIP_TYPES['General'],
  ];

  // Remove duplicates
  const seen = new Set<string>();
  return types.filter(t => {
    if (seen.has(t.value)) return false;
    seen.add(t.value);
    return true;
  });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ============================================================================
// BOOK METADATA OPTIONS
// ============================================================================

export const POV_STYLES = [
  { value: 'first_person', label: 'First Person', description: 'I/me narration' },
  { value: 'third_limited', label: 'Third Limited', description: 'He/she, one character\'s thoughts' },
  { value: 'third_omniscient', label: 'Third Omniscient', description: 'All-knowing narrator' },
  { value: 'second_person', label: 'Second Person', description: 'You narration' },
  { value: 'multiple_pov', label: 'Multiple POV', description: 'Multiple character viewpoints' },
];

export const TENSE_OPTIONS = [
  { value: 'past', label: 'Past Tense', description: 'He walked...' },
  { value: 'present', label: 'Present Tense', description: 'He walks...' },
];

export const PROSE_STYLES = [
  { value: 'literary', label: 'Literary', description: 'Artistic, layered prose' },
  { value: 'commercial', label: 'Commercial', description: 'Accessible, fast-paced' },
  { value: 'sparse', label: 'Sparse', description: 'Minimalist, Hemingway-style' },
  { value: 'ornate', label: 'Ornate', description: 'Rich, descriptive' },
  { value: 'conversational', label: 'Conversational', description: 'Casual, friendly' },
];

export const PACING_OPTIONS = [
  { value: 'fast', label: 'Fast', description: 'Quick scenes, lots of action' },
  { value: 'moderate', label: 'Moderate', description: 'Balanced pacing' },
  { value: 'slow', label: 'Slow', description: 'Deliberate, atmospheric' },
  { value: 'varied', label: 'Varied', description: 'Mixed pacing by scene' },
];

export const CONTENT_RATINGS = [
  { value: 'G', label: 'G - General', description: 'All ages' },
  { value: 'PG', label: 'PG - Parental Guidance', description: 'Some mature themes' },
  { value: 'PG-13', label: 'PG-13 - Teen', description: 'Teen appropriate' },
  { value: 'R', label: 'R - Mature', description: 'Adult themes' },
  { value: 'Adult', label: 'Adult Only', description: 'Explicit content' },
];

export const VIOLENCE_LEVELS = [
  { value: 'none', label: 'None', description: 'No violence' },
  { value: 'mild', label: 'Mild', description: 'Minor conflict, no gore' },
  { value: 'moderate', label: 'Moderate', description: 'Action/combat, limited detail' },
  { value: 'graphic', label: 'Graphic', description: 'Detailed violence' },
];

export const ROMANCE_LEVELS = [
  { value: 'none', label: 'None', description: 'No romance' },
  { value: 'fade_to_black', label: 'Fade to Black', description: 'Romance implied, not shown' },
  { value: 'moderate', label: 'Moderate', description: 'Some romantic scenes' },
  { value: 'explicit', label: 'Explicit', description: 'Detailed romantic content' },
];

export const TONE_OPTIONS = [
  { value: 'dark', label: 'Dark' },
  { value: 'hopeful', label: 'Hopeful' },
  { value: 'comedic', label: 'Comedic' },
  { value: 'tragic', label: 'Tragic' },
  { value: 'epic', label: 'Epic' },
  { value: 'intimate', label: 'Intimate' },
  { value: 'suspenseful', label: 'Suspenseful' },
  { value: 'whimsical', label: 'Whimsical' },
  { value: 'gritty', label: 'Gritty' },
  { value: 'romantic', label: 'Romantic' },
  { value: 'mysterious', label: 'Mysterious' },
  { value: 'adventurous', label: 'Adventurous' },
];

export const TARGET_AUDIENCES = [
  { value: 'middle_grade', label: 'Middle Grade', description: 'Ages 8-12' },
  { value: 'young_adult', label: 'Young Adult', description: 'Ages 12-18' },
  { value: 'new_adult', label: 'New Adult', description: 'Ages 18-25' },
  { value: 'adult', label: 'Adult', description: 'Ages 18+' },
];

export const SERIES_TYPES = [
  { value: 'standalone', label: 'Standalone', description: 'Single book' },
  { value: 'duology', label: 'Duology', description: 'Two books' },
  { value: 'trilogy', label: 'Trilogy', description: 'Three books' },
  { value: 'series', label: 'Series', description: 'Four+ books, planned ending' },
  { value: 'open_ended', label: 'Open-Ended', description: 'Ongoing series' },
];
