-- ============================================================================
-- SEED DATA: THE OUTLAW TRAIL
-- A complex western series spanning multiple books with rich character networks
-- ============================================================================

-- Create a test user in auth.users (for local development only)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'writer@outlawtrail.test',
  crypt('testpassword123', gen_salt('bf')),
  now(),
  '{"full_name": "Samuel Hawthorne", "avatar_url": null}'::jsonb,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Ensure profile exists
INSERT INTO public.profiles (id, email, full_name, subscription_tier, words_quota, words_used_this_month)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'writer@outlawtrail.test',
  'Samuel Hawthorne',
  'pro',
  100000,
  0
)
ON CONFLICT (id) DO UPDATE SET
  subscription_tier = 'pro',
  words_quota = 100000;

-- ============================================================================
-- PROJECT: THE OUTLAW TRAIL SERIES
-- ============================================================================

INSERT INTO public.projects (
  id, user_id, title, description, genre, world_setting, time_period,
  themes, world_description, subgenres, target_audience, content_rating,
  narrative_conventions, series_type, planned_books
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'The Outlaw Trail',
  'An epic western saga following the McAllister gang through the dying days of the American frontier. Set against the backdrop of the 1890s, it explores themes of redemption, loyalty, and the collision between the old west and encroaching modernity.',
  'Western',
  'American Southwest and Mexico, 1889-1899',
  '1889-1899',
  ARRAY['redemption', 'loyalty', 'freedom vs law', 'end of an era', 'found family', 'moral ambiguity'],
  'The American frontier in its final decade. Railroads are connecting the nation, telegraph lines hum with news, and Pinkertons hunt the last of the outlaw gangs. The Wild West is dying, but it will not go quietly. From the sun-scorched deserts of New Mexico to the snow-capped peaks of Colorado, from dusty border towns to the chaos of Mexico revolution, this is a world where a man word still means something—and a fast draw means everything.',
  ARRAY['Revisionist Western', 'Historical Fiction', 'Adventure'],
  'adult',
  'R',
  ARRAY['morally grey protagonists', 'ensemble cast', 'action sequences', 'period authenticity'],
  'trilogy',
  3
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- BOOKS
-- ============================================================================

-- Book 1: Blood and Dust
INSERT INTO public.books (
  id, project_id, title, subtitle, description, synopsis,
  target_word_count, current_word_count, status, sort_order,
  pov_style, tense, prose_style, pacing, dialogue_style,
  description_density, content_rating, violence_level, romance_level,
  profanity_level, tone
) VALUES (
  'bbbbbbbb-0001-bbbb-bbbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Blood and Dust',
  'The Outlaw Trail: Book One',
  'The McAllister gang pulls off their biggest heist yet, but success brings hunters: Pinkertons, bounty hunters, and a U.S. Marshal with a personal vendetta. As the noose tightens, leader Jack McAllister must keep his fractious gang together while planning one last score that could buy their freedom—or seal their doom.',
  'After a daring train robbery nets them $40,000 in railroad payroll, the McAllister gang retreats to their hideout in the Sangre de Cristo Mountains. But their success has painted a target on their backs. Marshal Thomas Garrett, whose brother died in the robbery, leads a posse into the mountains. Meanwhile, internal tensions threaten to tear the gang apart as Jack second-in-command, the volatile Cole Younger, pushes for bolder action. The story follows the gang through a brutal winter as they evade capture, plan their escape to Mexico, and face betrayal from within.',
  100000,
  0,
  'draft',
  1,
  'third_limited',
  'past',
  'sparse',
  'moderate',
  'naturalistic',
  'moderate',
  'R',
  'graphic',
  'fade_to_black',
  'moderate',
  ARRAY['gritty', 'tense', 'melancholic']
)
ON CONFLICT (id) DO NOTHING;

-- Book 2: The Long Ride South
INSERT INTO public.books (
  id, project_id, title, subtitle, description, synopsis,
  target_word_count, current_word_count, status, sort_order,
  pov_style, tense, prose_style, pacing, dialogue_style,
  description_density, content_rating, violence_level, romance_level,
  profanity_level, tone
) VALUES (
  'bbbbbbbb-0002-bbbb-bbbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'The Long Ride South',
  'The Outlaw Trail: Book Two',
  'Pursued by the law and haunted by betrayal, the remnants of the McAllister gang flee south toward the Mexican border. But sanctuary comes at a price, and they find themselves drawn into the brewing revolution that will change Mexico forever.',
  'Following the devastating events of Blood and Dust, Jack McAllister leads the survivors of his gang on a desperate ride south. Crossing into Mexico, they encounter Rosa Delgado, a revolutionary fighting against the corrupt Díaz regime. Jack and his people are offered sanctuary in exchange for their guns and expertise. As Jack grows closer to Rosa and her cause, he must confront whether he is running toward something or just running away. Meanwhile, Marshal Garrett crosses the border illegally, willing to break every law to get his man.',
  110000,
  0,
  'draft',
  2,
  'multiple_pov',
  'past',
  'sparse',
  'fast',
  'naturalistic',
  'moderate',
  'R',
  'graphic',
  'moderate',
  'moderate',
  ARRAY['epic', 'romantic', 'revolutionary']
)
ON CONFLICT (id) DO NOTHING;

-- Book 3: Last Stand at Copper Canyon
INSERT INTO public.books (
  id, project_id, title, subtitle, description, synopsis,
  target_word_count, current_word_count, status, sort_order,
  pov_style, tense, prose_style, pacing, dialogue_style,
  description_density, content_rating, violence_level, romance_level,
  profanity_level, tone
) VALUES (
  'bbbbbbbb-0003-bbbb-bbbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Last Stand at Copper Canyon',
  'The Outlaw Trail: Book Three',
  'The final chapter. With revolution sweeping Mexico and enemies closing from all sides, Jack McAllister must make one last stand—not just for survival, but for the legacy he will leave behind.',
  'The Mexican Revolution has erupted into full-scale war. Jack McAllister, now a reluctant revolutionary, leads a mixed force of outlaws and rebels against the federal army. But his past catches up when Marshal Garrett arrives with an offer: help bring down a corrupt American mining company secretly funding the federales, and earn a pardon for the entire gang. Jack must choose between the freedom he has always wanted and the cause he has come to believe in. The trilogy concludes with an epic battle at Copper Canyon, where the last of the Old West outlaws make their final stand.',
  120000,
  0,
  'draft',
  3,
  'multiple_pov',
  'past',
  'sparse',
  'fast',
  'naturalistic',
  'rich',
  'R',
  'graphic',
  'moderate',
  'strong',
  ARRAY['epic', 'redemptive', 'bittersweet']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORY NODES: CHARACTERS
-- ============================================================================

-- Jack McAllister - Protagonist
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  character_role, character_arc, attributes, tags, position_x, position_y
) VALUES (
  'cccccccc-0001-cccc-cccc-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'character',
  'Jack McAllister',
  'Leader of the McAllister gang. A former Confederate cavalry officer who turned to outlawry after the war destroyed his family ranch. At 42, he is older than most in his profession and knows the outlaw life is ending. Calm under pressure, fiercely loyal, and haunted by the violence he has done.',
  'Key traits: Natural leader, tactical thinker, crack shot with a rifle. Carries a Colt Single Action Army and his father Civil War saber. Has a scar across his left cheek from a saber duel. Struggles with whiskey but stays dry during jobs. Secretly sends money to a widow in Denver whose husband he killed in a robbery gone wrong.',
  'protagonist',
  'From cynical outlaw to revolutionary with a cause. Starts believing only in survival and his gang, ends willing to die for something greater.',
  '{"age": 42, "height": "6ft1in", "hair": "grey-streaked brown", "eyes": "pale blue", "build": "lean, weathered", "skills": ["leadership", "horsemanship", "rifle", "tactics", "poker"], "flaws": ["guilt", "alcoholism (recovering)", "trust issues"], "quirks": ["quotes Shakespeare", "whittles chess pieces"], "weapon": "Colt SAA, Winchester 1873"}'::jsonb,
  ARRAY['gang leader', 'civil war veteran', 'protagonist', 'book 1 pov', 'book 2 pov', 'book 3 pov'],
  0, 0
)
ON CONFLICT (id) DO NOTHING;

-- Cole Brennan - Second in Command
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  character_role, character_arc, attributes, tags, position_x, position_y
) VALUES (
  'cccccccc-0002-cccc-cccc-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'character',
  'Cole Brennan',
  'Jack second-in-command and the gang most dangerous gunfighter. A former Texas Ranger who was drummed out for excessive violence. Quick-tempered, fiercely loyal to Jack personally, but increasingly at odds with Jack cautious leadership. At 35, he believes he should be running the gang.',
  'Key traits: Fastest draw in the gang, possibly in the territory. Expert tracker. Prone to violence when drinking. Has a twisted code of honor—never kills women or children, but will kill anyone else without hesitation. Secretly in love with Elena, though she barely acknowledges him.',
  'secondary protagonist',
  'From loyal lieutenant to tragic antagonist. His loyalty to Jack conflicts with his ambition and violent nature, leading to inevitable betrayal.',
  '{"age": 35, "height": "5ft11in", "hair": "black", "eyes": "dark brown", "build": "muscular", "skills": ["fast draw", "tracking", "intimidation", "knife fighting"], "flaws": ["violent temper", "alcoholism", "jealousy", "pride"], "quirks": ["spins his pistol when nervous", "never sits with back to door"], "weapon": "dual Colt SAAs, Bowie knife"}'::jsonb,
  ARRAY['gang member', 'gunfighter', 'deuteragonist', 'book 1 pov', 'antagonist book 2'],
  200, 0
)
ON CONFLICT (id) DO NOTHING;

-- Elena Vasquez
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  character_role, character_arc, attributes, tags, position_x, position_y
) VALUES (
  'cccccccc-0003-cccc-cccc-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'character',
  'Elena Vasquez',
  'The gang scout and Jack former lover. Half-Mexican, half-Apache, she was raised by her Apache grandmother after her Mexican father was killed by Texas Rangers. At 28, she is the best rider and tracker in the gang, with knowledge of the borderlands that has saved them countless times.',
  'Key traits: Expert horsewoman, speaks Apache, Spanish, and English. Can move silently through any terrain. Carries a Spencer carbine and knows the location of every water source between Colorado and Chihuahua. Left Jack after he chose the gang over settling down with her.',
  'secondary protagonist',
  'From wounded lover to independent warrior. Learns to fight for her own causes rather than following men.',
  '{"age": 28, "height": "5ft6in", "hair": "black", "eyes": "dark brown", "build": "athletic", "skills": ["tracking", "riding", "survival", "languages", "rifle"], "flaws": ["emotional walls", "recklessness", "grudge-holding"], "quirks": ["hums Apache songs when scouting", "collects interesting stones"], "weapon": "Spencer carbine, boot knife"}'::jsonb,
  ARRAY['gang member', 'scout', 'book 1 pov', 'book 2 pov', 'love interest'],
  100, 100
)
ON CONFLICT (id) DO NOTHING;

-- Reverend Isaiah "Preacher" Jones
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  character_role, character_arc, attributes, tags, position_x, position_y
) VALUES (
  'cccccccc-0004-cccc-cccc-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'character',
  'Isaiah "Preacher" Jones',
  'A former slave who became a Baptist minister before a lynch mob killed his congregation. Now 55, he is the gang oldest member and serves as their moral compass—such as it is. A crack shot who believes God has a plan for him, even if that plan involves robbing trains.',
  'Key traits: Powerful orator who can talk their way out of situations. Expert with a shotgun. Provides spiritual counsel to the gang. Has a photographic memory for Scripture and uses biblical references in everyday speech.',
  'supporting',
  'From bitter survivor to man of renewed faith. Finds redemption in protecting others and ultimately sacrifices himself.',
  '{"age": 55, "height": "6ft2in", "hair": "grey", "eyes": "brown", "build": "powerful despite age", "skills": ["oratory", "shotgun", "medicine", "reading people"], "flaws": ["rage at injustice", "nightmares", "stubborn"], "quirks": ["quotes scripture constantly", "sings spirituals"], "weapon": "Winchester 1887 shotgun"}'::jsonb,
  ARRAY['gang member', 'former slave', 'moral compass', 'book 1 support'],
  -100, 100
)
ON CONFLICT (id) DO NOTHING;

-- "Doc" Whitmore
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  character_role, character_arc, attributes, tags, position_x, position_y
) VALUES (
  'cccccccc-0005-cccc-cccc-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'character',
  'William "Doc" Whitmore',
  'A disgraced Army surgeon who lost his license after a drunken operation killed a general son. At 38, his hands still shake in the morning but grow steady by noon. The gang medic, safecracker, and reluctant voice of reason.',
  'Key traits: Brilliant doctor when sober. Expert at cracking safes (steady hands). Cynical and sardonic. Addicted to laudanum and whiskey but functional. Keeps detailed journals that serve as the narrative frame for the story.',
  'supporting',
  'From self-destructive cynic to someone who finds purpose in healing rather than just surviving.',
  '{"age": 38, "height": "5ft9in", "hair": "auburn", "eyes": "green", "build": "slight", "skills": ["medicine", "chemistry", "safecracking", "observation"], "flaws": ["addiction", "cowardice", "self-loathing"], "quirks": ["narrates events in his head", "makes black humor jokes"], "weapon": "Remington derringer"}'::jsonb,
  ARRAY['gang member', 'doctor', 'narrator frame', 'book 1 support'],
  -100, -100
)
ON CONFLICT (id) DO NOTHING;

-- Marshal Thomas Garrett
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  character_role, character_arc, attributes, tags, position_x, position_y
) VALUES (
  'cccccccc-0006-cccc-cccc-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'character',
  'Thomas Garrett',
  'U.S. Marshal whose younger brother Daniel was killed in the McAllister gang train robbery. A methodical lawman who has never failed to bring in a wanted man. At 45, he is respected throughout the territory but his pursuit of Jack has become an obsession.',
  'Key traits: Expert manhunter and interrogator. Never drinks, never gambles. Carries his brother pocket watch. Will bend the law but will not break it—until Jack pushes him too far. Secretly respects Jack as a worthy adversary.',
  'antagonist',
  'From righteous lawman to someone who questions whether law and justice are the same thing.',
  '{"age": 45, "height": "6ft0in", "hair": "grey", "eyes": "steel grey", "build": "solid", "skills": ["investigation", "tracking", "leadership", "interrogation"], "flaws": ["obsession", "inflexibility", "grief"], "quirks": ["polishes brother watch when thinking", "never raises voice"], "weapon": "Smith and Wesson No. 3, badge"}'::jsonb,
  ARRAY['antagonist', 'lawman', 'book 1 pov', 'book 2 pov', 'book 3 ally'],
  300, 0
)
ON CONFLICT (id) DO NOTHING;

-- Rosa Delgado
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  character_role, character_arc, attributes, tags, position_x, position_y
) VALUES (
  'cccccccc-0007-cccc-cccc-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'character',
  'Rosa Delgado',
  'A Mexican revolutionary and former schoolteacher whose family was murdered by federal soldiers. At 32, she leads a band of rebels fighting against the Díaz regime. Educated, passionate, and utterly committed to her cause, she sees in Jack both a useful ally and a kindred spirit.',
  'Key traits: Brilliant tactician and inspiring leader. Speaks English, Spanish, French. Expert with rifle and machete. Lost her husband and two children to federales. Has no interest in personal survival, only victory.',
  'secondary protagonist',
  'From vengeance-driven revolutionary to leader who understands that victory means building, not just destroying.',
  '{"age": 32, "height": "5ft5in", "hair": "black", "eyes": "dark brown", "build": "slim but strong", "skills": ["tactics", "languages", "rifle", "inspiration", "teaching"], "flaws": ["fatalism", "ruthlessness", "survivor guilt"], "quirks": ["quotes Juarez", "teaches children to read between battles"], "weapon": "Mauser rifle, machete"}'::jsonb,
  ARRAY['revolutionary', 'love interest book 2', 'book 2 pov', 'book 3 pov'],
  0, 200
)
ON CONFLICT (id) DO NOTHING;

-- "Dynamite" Dan Murphy
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  character_role, character_arc, attributes, tags, position_x, position_y
) VALUES (
  'cccccccc-0008-cccc-cccc-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'character',
  'Daniel "Dynamite Dan" Murphy',
  'Irish immigrant and former railroad worker who learned explosives blasting tunnels through the Rockies. At 29, he is the youngest core member of the gang. Cheerful, irreverent, and absolutely fearless—possibly because he does not expect to live long anyway.',
  'Key traits: Expert with dynamite and black powder. Seemingly immune to fear. Tells terrible jokes constantly. Has a gift for improvisation. Lost three fingers on his left hand to an early experiment.',
  'supporting',
  'From reckless youth to someone who finds things worth living for.',
  '{"age": 29, "height": "5ft8in", "hair": "red", "eyes": "blue", "build": "wiry", "skills": ["explosives", "demolition", "improvisation", "humor"], "flaws": ["recklessness", "talks too much", "impulsive"], "quirks": ["counts to three before detonations even when not needed", "terrible Irish accent jokes"], "weapon": "dynamite, shotgun"}'::jsonb,
  ARRAY['gang member', 'explosives expert', 'comic relief', 'book 1 support'],
  100, -100
)
ON CONFLICT (id) DO NOTHING;

-- Cornelia "Copper" Walsh
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  character_role, character_arc, attributes, tags, position_x, position_y
) VALUES (
  'cccccccc-0009-cccc-cccc-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'character',
  'Cornelia "Copper" Walsh',
  'A former Pinkerton agent who switched sides after discovering the agency was being used to massacre striking miners. At 30, she is the newest member of the gang and still not fully trusted. Expert detective and sharpshooter.',
  'Key traits: Analytical mind, excellent markswoman. Still has Pinkerton contacts. Carries guilt over people she helped hunt. Red hair gives her the nickname. Has a photographic memory for faces and details.',
  'supporting',
  'From conflicted turncoat to fully committed gang member who proves her loyalty.',
  '{"age": 30, "height": "5ft7in", "hair": "red", "eyes": "hazel", "build": "athletic", "skills": ["investigation", "disguise", "sharpshooting", "contacts"], "flaws": ["trust issues", "guilt", "difficulty connecting"], "quirks": ["takes notes constantly", "analyzes everyone she meets"], "weapon": "Winchester 1876, hidden derringer"}'::jsonb,
  ARRAY['gang member', 'former pinkerton', 'book 1 support', 'book 2 support'],
  200, 100
)
ON CONFLICT (id) DO NOTHING;

-- Hector Montoya
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  character_role, character_arc, attributes, tags, position_x, position_y
) VALUES (
  'cccccccc-0010-cccc-cccc-cccccccccccc',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'character',
  'Hector Montoya',
  'A Mexican vaquero and horse whisperer who joined the gang after they saved his village from bandits. At 40, he is a quiet, steady presence who says little but sees everything. The gang horse master and backup tracker.',
  'Key traits: Best horse handler any of them have seen. Excellent with a lasso. Calm in any crisis. Speaks rarely but meaningfully. Has a wife and children in Mexico he sends money to.',
  'supporting',
  'Steady presence throughout. Returns to his family at the end.',
  '{"age": 40, "height": "5ft10in", "hair": "black with grey", "eyes": "brown", "build": "lean, strong", "skills": ["horses", "lasso", "tracking", "patience"], "flaws": ["homesickness", "too trusting", "non-confrontational"], "quirks": ["talks to horses more than people", "whittles animals"], "weapon": "lasso, coach gun"}'::jsonb,
  ARRAY['gang member', 'horse master', 'book 1 support', 'book 2 support'],
  -200, 0
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORY NODES: LOCATIONS
-- ============================================================================

-- Eagle Nest Hideout
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  location_type, attributes, tags, position_x, position_y
) VALUES (
  'dddddddd-0001-dddd-dddd-dddddddddddd',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'location',
  'Eagle Nest',
  'The McAllister gang primary hideout, a natural fortress in the Sangre de Cristo Mountains. A box canyon accessible only through a narrow pass, with caves for shelter, a spring for water, and sight lines that make approach nearly impossible.',
  'Features: Narrow entrance can be defended by two men. Network of caves provides shelter even in winter. Natural corral for horses. Emergency escape route through caves to the other side of the mountain—known only to Jack and Elena.',
  'hideout',
  '{"elevation": "9500 feet", "access": "single narrow pass", "capacity": "30 people, 50 horses", "features": ["caves", "spring", "natural corral", "escape route"], "nearest_town": "Cimarron, 40 miles"}'::jsonb,
  ARRAY['hideout', 'book 1 setting', 'defensible', 'mountain'],
  -300, 200
)
ON CONFLICT (id) DO NOTHING;

-- Redemption, New Mexico
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  location_type, attributes, tags, position_x, position_y
) VALUES (
  'dddddddd-0002-dddd-dddd-dddddddddddd',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'location',
  'Redemption, New Mexico',
  'A dying mining town that serves as the gang main supply point. Population 200 and shrinking since the silver played out. The sheriff is on the gang payroll, and the town economy now depends largely on outlaw money.',
  'Features: The Silver Dollar Saloon (gang regular meeting spot), general store, livery stable, abandoned mine, sheriff office (friendly), telegraph office (monitored).',
  'town',
  '{"population": 200, "economy": "dying mining, outlaw money", "key_buildings": ["Silver Dollar Saloon", "General Store", "Livery Stable", "Abandoned Mine"], "law_enforcement": "corrupted", "telegraph": true}'::jsonb,
  ARRAY['town', 'book 1 setting', 'supply point', 'corrupt'],
  -400, 100
)
ON CONFLICT (id) DO NOTHING;

-- The Silver Dollar Saloon
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  location_type, attributes, tags, position_x, position_y
) VALUES (
  'dddddddd-0003-dddd-dddd-dddddddddddd',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'location',
  'The Silver Dollar Saloon',
  'Main gathering place in Redemption. Two-story building with a bar, card tables, and rooms upstairs. Owner Maggie Chen is an ally of the gang and keeps a room permanently reserved for Jack.',
  'Features: Secret cellar for hiding, back exit to alley, upstairs has clear sight lines to main street. Maggie waters the drinks for lawmen.',
  'saloon',
  '{"owner": "Maggie Chen", "floors": 2, "features": ["secret cellar", "back exit", "reserved room"], "atmosphere": "rough but friendly"}'::jsonb,
  ARRAY['saloon', 'book 1 setting', 'ally location'],
  -400, 0
)
ON CONFLICT (id) DO NOTHING;

-- Santa Elena Canyon
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  location_type, attributes, tags, position_x, position_y
) VALUES (
  'dddddddd-0004-dddd-dddd-dddddddddddd',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'location',
  'Santa Elena Canyon',
  'A massive limestone canyon where the Rio Grande cuts through the Sierra del Carmen. The crossing point the gang uses to slip between Texas and Mexico. Dangerous but unpatrolled.',
  'Features: 1,500-foot cliffs, treacherous river crossing, multiple smuggler trails. Known only to Elena and a few others.',
  'canyon',
  '{"cliff_height": "1500 feet", "river": "Rio Grande", "danger_level": "high", "patrol": "none", "routes": "multiple smuggler trails"}'::jsonb,
  ARRAY['canyon', 'border crossing', 'book 1 setting', 'book 2 setting', 'dangerous'],
  0, 300
)
ON CONFLICT (id) DO NOTHING;

-- San Cristobal
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  location_type, attributes, tags, position_x, position_y
) VALUES (
  'dddddddd-0005-dddd-dddd-dddddddddddd',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'location',
  'San Cristobal',
  'A mountain village in Chihuahua that serves as Rosa Delgado rebel base. Population 300, all loyal to the revolution. Hidden in a valley accessible only through a single mountain pass.',
  'Features: Adobe church converted to headquarters, natural hot springs, terraced farms, weapons cache in old mine.',
  'village',
  '{"population": 300, "allegiance": "revolutionary", "features": ["rebel HQ in church", "hot springs", "weapons cache"], "defense": "mountain pass bottleneck"}'::jsonb,
  ARRAY['village', 'book 2 setting', 'book 3 setting', 'rebel base', 'mexico'],
  100, 400
)
ON CONFLICT (id) DO NOTHING;

-- Copper Canyon Mining Complex
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  location_type, attributes, tags, position_x, position_y
) VALUES (
  'dddddddd-0006-dddd-dddd-dddddddddddd',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'location',
  'Copper Canyon Mining Complex',
  'A massive American-owned copper mine in the Sierra Madre. Uses essentially slave labor and has a private army of guards. The final battle takes place here.',
  'Features: Main pit mine, processing facility, company town, fortified hacienda for the owners, rail line to the coast.',
  'mine',
  '{"owner": "American Consolidated Mining", "workforce": "2000 (enslaved)", "guards": 200, "features": ["pit mine", "rail line", "fortified hacienda", "company town"], "strategic_value": "high"}'::jsonb,
  ARRAY['mine', 'book 3 setting', 'climax location', 'enemy territory'],
  200, 400
)
ON CONFLICT (id) DO NOTHING;

-- The Atchison Express
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  location_type, attributes, tags, position_x, position_y
) VALUES (
  'dddddddd-0007-dddd-dddd-dddddddddddd',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'location',
  'The Atchison Express',
  'The Santa Fe Railroad train robbed in the opening of Book 1. Carries payroll, mail, and passengers between Kansas City and Santa Fe.',
  'Features: Locomotive, coal tender, mail car (safe), two passenger cars, caboose. Armed guards in mail car.',
  'train',
  '{"railroad": "Santa Fe", "route": "Kansas City to Santa Fe", "cars": ["locomotive", "tender", "mail car", "2 passenger cars", "caboose"], "security": "2-4 armed guards"}'::jsonb,
  ARRAY['train', 'book 1 opening', 'heist location'],
  -300, -100
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORY NODES: ITEMS
-- ============================================================================

-- The Confederate Saber
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  attributes, tags, position_x, position_y
) VALUES (
  'eeeeeeee-0001-eeee-eeee-eeeeeeeeeeee',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'item',
  'McAllister Family Saber',
  'A Confederate cavalry saber that belonged to Jack father. Carried through the Civil War and passed to Jack before his father died. One of Jack few connections to his past.',
  'Jack keeps it wrapped in oilcloth but takes it out when he needs to remember who he used to be. Will give it to someone he trusts at a crucial moment.',
  '{"type": "weapon", "origin": "Civil War", "material": "steel, brass guard", "inscription": "McAllister, Virginia", "significance": "connection to past, symbol of honor"}'::jsonb,
  ARRAY['weapon', 'heirloom', 'symbol', 'jack personal'],
  50, -50
)
ON CONFLICT (id) DO NOTHING;

-- Daniel Garrett Pocket Watch
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  attributes, tags, position_x, position_y
) VALUES (
  'eeeeeeee-0002-eeee-eeee-eeeeeeeeeeee',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'item',
  'Daniel Garrett Pocket Watch',
  'A silver pocket watch that belonged to Marshal Garrett younger brother Daniel, killed in the train robbery. Thomas carries it always, checking it obsessively. Stopped at 3:47—the moment Daniel died.',
  'A symbol of Garrett obsession and grief. He will give it to Jack at the end when he finally lets go of his vendetta.',
  '{"type": "pocket watch", "material": "silver", "time_stopped": "3:47 PM", "owner": "Daniel Garrett (deceased)", "significance": "grief, obsession, eventual forgiveness"}'::jsonb,
  ARRAY['personal item', 'symbol', 'garrett personal', 'plot important'],
  350, -50
)
ON CONFLICT (id) DO NOTHING;

-- The $40,000 Payroll
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  attributes, tags, position_x, position_y
) VALUES (
  'eeeeeeee-0003-eeee-eeee-eeeeeeeeeeee',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'item',
  'Railroad Payroll',
  'The $40,000 in cash and gold taken from the Atchison Express in the opening robbery. This money is the engine that drives the plot—it is enough to let the gang disappear forever, but it also makes them the most wanted outlaws in the territory.',
  'Hidden in multiple caches. Some will be lost to betrayal, some to necessity, some to helping the revolution.',
  '{"type": "money", "amount": "$40,000", "form": "cash and gold coins", "source": "Santa Fe Railroad", "significance": "mcguffin, freedom price"}'::jsonb,
  ARRAY['treasure', 'mcguffin', 'plot driver'],
  -200, -100
)
ON CONFLICT (id) DO NOTHING;

-- Rosa Revolutionary Manifesto
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  attributes, tags, position_x, position_y
) VALUES (
  'eeeeeeee-0004-eeee-eeee-eeeeeeeeeeee',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'item',
  'Land and Liberty Manifesto',
  'A document Rosa wrote outlining the goals of the revolution: land reform, education, and freedom from foreign exploitation. She makes Jack read it, and it plants the seeds of his transformation.',
  'Based on real revolutionary documents of the era. Will be printed and distributed, spreading the revolution.',
  '{"type": "document", "author": "Rosa Delgado", "language": "Spanish", "contents": "revolutionary principles", "significance": "catalyst for Jack transformation"}'::jsonb,
  ARRAY['document', 'revolutionary', 'symbol', 'plot important'],
  50, 250
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORY NODES: FACTIONS
-- ============================================================================

-- The McAllister Gang
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  attributes, tags, position_x, position_y
) VALUES (
  'ffffffff-0001-ffff-ffff-ffffffffffff',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'faction',
  'The McAllister Gang',
  'A tight-knit band of outlaws led by Jack McAllister. Unlike many gangs, they have a code: no killing unless necessary, share the take equally, and never betray each other. This code will be tested throughout the series.',
  'At full strength: Jack (leader), Cole (second), Elena (scout), Preacher (moral compass), Doc (medic), Dan (explosives), Copper (intel), Hector (horses), plus 5-6 rotating members.',
  '{"type": "outlaw gang", "membership": "8-12 core, others rotate", "territory": "New Mexico, Colorado, Texas", "code": ["no unnecessary killing", "equal shares", "loyalty"], "reputation": "professional, honorable for outlaws"}'::jsonb,
  ARRAY['faction', 'protagonist group', 'outlaws'],
  0, -200
)
ON CONFLICT (id) DO NOTHING;

-- U.S. Marshals Service
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  attributes, tags, position_x, position_y
) VALUES (
  'ffffffff-0002-ffff-ffff-ffffffffffff',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'faction',
  'U.S. Marshals Service',
  'The federal law enforcement hunting the gang. Led in this pursuit by Marshal Thomas Garrett, they represent the encroaching law and order that is ending the era of western outlaws.',
  'Garrett has a rotating posse of deputies, can call on local law enforcement, and has the authority to pursue across state lines.',
  '{"type": "law enforcement", "jurisdiction": "federal", "resources": "moderate", "authority": "arrest warrants, cross state lines", "leader": "Marshal Thomas Garrett"}'::jsonb,
  ARRAY['faction', 'antagonist group', 'law'],
  400, 0
)
ON CONFLICT (id) DO NOTHING;

-- Pinkerton National Detective Agency
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  attributes, tags, position_x, position_y
) VALUES (
  'ffffffff-0003-ffff-ffff-ffffffffffff',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'faction',
  'Pinkerton National Detective Agency',
  'Private detectives hired by the railroad to recover the stolen payroll. More ruthless than the Marshals and not bound by the same rules. Will eventually be revealed as working with the mining company.',
  'Led by Agent Crawford, who has a personal vendetta against Copper for betraying the agency.',
  '{"type": "private detective", "employer": "Santa Fe Railroad / American Consolidated Mining", "resources": "high", "methods": "ruthless, not bound by law", "leader": "Agent Marcus Crawford"}'::jsonb,
  ARRAY['faction', 'antagonist group', 'pinkertons', 'corporate'],
  400, 100
)
ON CONFLICT (id) DO NOTHING;

-- Delgado Rebels
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  attributes, tags, position_x, position_y
) VALUES (
  'ffffffff-0004-ffff-ffff-ffffffffffff',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'faction',
  'Delgado Rebels',
  'Mexican revolutionaries led by Rosa Delgado, fighting against the Díaz regime and foreign exploitation. They represent the future and the possibility of fighting for something greater than personal gain.',
  'About 200 fighters, mix of former soldiers, peasants, and idealists. Well-organized but poorly supplied until the gang arrives.',
  '{"type": "revolutionary", "goal": "overthrow Diaz, land reform", "membership": "~200 fighters", "territory": "Chihuahua mountains", "resources": "low until alliance with gang", "leader": "Rosa Delgado"}'::jsonb,
  ARRAY['faction', 'ally group', 'revolutionary', 'mexico'],
  0, 400
)
ON CONFLICT (id) DO NOTHING;

-- American Consolidated Mining
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  attributes, tags, position_x, position_y
) VALUES (
  'ffffffff-0005-ffff-ffff-ffffffffffff',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'faction',
  'American Consolidated Mining',
  'The true villains of the series. An American corporation exploiting Mexican workers and resources, secretly funding the federal army to maintain their control. Their destruction is the climax of Book 3.',
  'Led by William Hearst Jr. (fictional relation), with a private army and political connections on both sides of the border.',
  '{"type": "corporation", "industry": "mining", "assets": "copper mines, rail lines, private army", "methods": "slavery, bribery, violence", "leader": "William Hearst Jr."}'::jsonb,
  ARRAY['faction', 'antagonist group', 'corporation', 'final enemy'],
  300, 400
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORY NODES: EVENTS (using valid hex UUIDs)
-- ============================================================================

-- The Train Robbery
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  event_date, attributes, tags, position_x, position_y
) VALUES (
  'a0a0a0a0-0001-a0a0-a0a0-a0a0a0a0a0a0',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'event',
  'The Atchison Express Robbery',
  'The daring train robbery that opens Book 1. The gang stops the Atchison Express in Apache Canyon, cracks the safe, and escapes with $40,000. But Daniel Garrett is killed in the crossfire, setting Marshal Garrett on their trail.',
  'Key moments: Dan blows the tracks, Jack talks down the conductor, Cole kills Daniel Garrett against orders, Elena spots the approaching cavalry and signals retreat.',
  'March 15, 1889',
  '{"type": "heist", "participants": ["Jack", "Cole", "Elena", "Dan", "Preacher", "Doc"], "outcome": "success with complications", "consequences": ["$40,000 stolen", "Daniel Garrett killed", "massive manhunt begins"]}'::jsonb,
  ARRAY['event', 'inciting incident', 'book 1 opening'],
  -300, -200
)
ON CONFLICT (id) DO NOTHING;

-- Cole Betrayal
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  event_date, attributes, tags, position_x, position_y
) VALUES (
  'a0a0a0a0-0002-a0a0-a0a0-a0a0a0a0a0a0',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'event',
  'Cole Betrayal',
  'The climax of Book 1. Cole, frustrated with Jack leadership and bitter about Elena, leads the Marshals to Eagle Nest in exchange for a pardon. The gang escapes through the secret passage, but Preacher dies covering their retreat.',
  'Key moments: Cole deal with Garrett, the night attack, Preacher last stand, Jack escape with half the money.',
  'November 1889',
  '{"type": "betrayal", "perpetrator": "Cole Brennan", "victims": ["gang", "especially Preacher"], "outcome": "gang scattered, hideout lost", "consequences": ["Preacher killed", "gang flees south", "Cole becomes antagonist"]}'::jsonb,
  ARRAY['event', 'climax', 'book 1 ending', 'tragedy'],
  -100, -200
)
ON CONFLICT (id) DO NOTHING;

-- Crossing into Mexico
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  event_date, attributes, tags, position_x, position_y
) VALUES (
  'a0a0a0a0-0003-a0a0-a0a0-a0a0a0a0a0a0',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'event',
  'Crossing the Rio Grande',
  'The opening of Book 2. The survivors of the gang make a desperate crossing at Santa Elena Canyon, evading both American and Mexican patrols. Elena nearly drowns but Jack saves her, beginning their reconciliation.',
  'Key moments: Dangerous river crossing, Elena near-death, first glimpse of Mexican federal patrol, decision to head into the mountains.',
  'December 1889',
  '{"type": "escape", "participants": ["Jack", "Elena", "Doc", "Dan", "Copper", "Hector"], "outcome": "successful crossing", "consequences": ["enter Mexico", "Jack-Elena reconnect", "new chapter begins"]}'::jsonb,
  ARRAY['event', 'book 2 opening', 'transition'],
  50, 300
)
ON CONFLICT (id) DO NOTHING;

-- Meeting Rosa
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  event_date, attributes, tags, position_x, position_y
) VALUES (
  'a0a0a0a0-0004-a0a0-a0a0-a0a0a0a0a0a0',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'event',
  'First Contact with Rebels',
  'The gang stumbles into a rebel ambush and is captured. Rosa decides to spare them when she learns they are American outlaws—she can use their skills. The beginning of the alliance that will define Books 2 and 3.',
  'Key moments: Ambush, tense negotiation, Rosa tests Jack, alliance formed. Jack and Rosa feel immediate connection despite language barrier.',
  'January 1890',
  '{"type": "meeting", "participants": ["gang", "Rosa Delgado", "rebels"], "outcome": "alliance formed", "consequences": ["gang joins revolution", "Jack-Rosa relationship begins", "new purpose found"]}'::jsonb,
  ARRAY['event', 'book 2 turning point', 'alliance'],
  100, 350
)
ON CONFLICT (id) DO NOTHING;

-- Battle of Copper Canyon
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  event_date, attributes, tags, position_x, position_y
) VALUES (
  'a0a0a0a0-0005-a0a0-a0a0-a0a0a0a0a0a0',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'event',
  'Battle of Copper Canyon',
  'The climax of the series. The combined force of outlaws, rebels, and (surprisingly) Marshal Garrett assault the mining complex to free the enslaved workers and destroy the company operations.',
  'Key moments: Dan explosive sabotage, Rosa cavalry charge, Jack duel with Cole (who is working for the mining company), Garrett last-minute intervention, destruction of the mine.',
  'September 1891',
  '{"type": "battle", "forces": ["rebels", "outlaws", "one Marshal"], "enemy": "mining company guards, Cole", "outcome": "victory at great cost", "consequences": ["mine destroyed", "workers freed", "Cole killed", "Jack wounded"]}'::jsonb,
  ARRAY['event', 'climax', 'book 3 ending', 'final battle'],
  200, 450
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORY NODES: CONCEPTS (using valid hex UUIDs)
-- ============================================================================

-- The Dying West
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  attributes, tags, position_x, position_y
) VALUES (
  'b0b0b0b0-0001-b0b0-b0b0-b0b0b0b0b0b0',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'concept',
  'The End of the Frontier',
  'A central theme of the series. The Wild West is dying—railroads, telegraphs, and organized law enforcement are closing the frontier. The gang represents the last of a breed, and they know it.',
  'Manifests in: Jack melancholy, the increasing difficulty of finding safe territory, the contrast between old ways and new, the choice to find a new cause.',
  '{"theme_type": "setting", "related_themes": ["progress", "nostalgia", "adaptation"], "symbolic_elements": ["railroad", "telegraph", "barbed wire"]}'::jsonb,
  ARRAY['concept', 'theme', 'central'],
  -400, -200
)
ON CONFLICT (id) DO NOTHING;

-- Redemption Through Purpose
INSERT INTO public.story_nodes (
  id, project_id, node_type, name, description, notes,
  attributes, tags, position_x, position_y
) VALUES (
  'b0b0b0b0-0002-b0b0-b0b0-b0b0b0b0b0b0',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'concept',
  'Redemption Through Purpose',
  'The character arc theme. Each main character finds redemption not through punishment or forgiveness, but through finding something worth fighting for beyond personal survival.',
  'Jack finds the revolution, Garrett finds justice over vengeance, Elena finds her Apache heritage, Doc finds healing over destruction.',
  '{"theme_type": "character", "related_themes": ["purpose", "meaning", "second chances"], "character_arcs": ["Jack", "Garrett", "Elena", "Doc"]}'::jsonb,
  ARRAY['concept', 'theme', 'character arcs'],
  -400, -300
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORY EDGES: RELATIONSHIPS
-- ============================================================================

-- Jack -> Gang (leads)
INSERT INTO public.story_edges (id, project_id, source_node_id, target_node_id, relationship_type, label, description, weight, is_bidirectional)
VALUES ('99999999-0001-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0001-cccc-cccc-cccccccccccc', 'ffffffff-0001-ffff-ffff-ffffffffffff', 'leads', 'Leader', 'Jack McAllister is the undisputed leader of the gang, commanding through respect rather than fear.', 10, false)
ON CONFLICT DO NOTHING;

-- Jack -> Cole (commands/tensions with)
INSERT INTO public.story_edges (id, project_id, source_node_id, target_node_id, relationship_type, label, description, weight, is_bidirectional)
VALUES ('99999999-0002-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0001-cccc-cccc-cccccccccccc', 'cccccccc-0002-cccc-cccc-cccccccccccc', 'commands', 'Second in Command', 'Cole is Jack second but increasingly chafes under his cautious leadership.', 7, false)
ON CONFLICT DO NOTHING;

-- Jack -> Elena (former lovers)
INSERT INTO public.story_edges (id, project_id, source_node_id, target_node_id, relationship_type, label, description, weight, is_bidirectional)
VALUES ('99999999-0003-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0001-cccc-cccc-cccccccccccc', 'cccccccc-0003-cccc-cccc-cccccccccccc', 'former_lovers', 'Former Lovers', 'Jack and Elena were together for two years before she left, feeling he would always choose the gang over her.', 8, true)
ON CONFLICT DO NOTHING;

-- Jack -> Preacher (trusts)
INSERT INTO public.story_edges (id, project_id, source_node_id, target_node_id, relationship_type, label, description, weight, is_bidirectional)
VALUES ('99999999-0004-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0001-cccc-cccc-cccccccccccc', 'cccccccc-0004-cccc-cccc-cccccccccccc', 'trusts', 'Trusted Advisor', 'Preacher is the one person Jack truly confides in, the gang moral compass.', 9, true)
ON CONFLICT DO NOTHING;

-- Jack -> Rosa (allies/lovers)
INSERT INTO public.story_edges (id, project_id, source_node_id, target_node_id, relationship_type, label, description, weight, is_bidirectional, valid_from_book_id)
VALUES ('99999999-0005-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0001-cccc-cccc-cccccccccccc', 'cccccccc-0007-cccc-cccc-cccccccccccc', 'lovers', 'Revolutionary Partners', 'Jack and Rosa become allies, then lovers, their relationship forged in the fires of revolution.', 9, true, 'bbbbbbbb-0002-bbbb-bbbb-bbbbbbbbbbbb')
ON CONFLICT DO NOTHING;

-- Cole -> Elena (unrequited)
INSERT INTO public.story_edges (id, project_id, source_node_id, target_node_id, relationship_type, label, description, weight, is_bidirectional)
VALUES ('99999999-0006-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0002-cccc-cccc-cccccccccccc', 'cccccccc-0003-cccc-cccc-cccccccccccc', 'unrequited_love', 'Unrequited', 'Cole is secretly in love with Elena, who barely notices him. This fuels his resentment of Jack.', 6, false)
ON CONFLICT DO NOTHING;

-- Cole -> Jack (rivalry)
INSERT INTO public.story_edges (id, project_id, source_node_id, target_node_id, relationship_type, label, description, weight, is_bidirectional, valid_from_book_id)
VALUES ('99999999-0007-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0002-cccc-cccc-cccccccccccc', 'cccccccc-0001-cccc-cccc-cccccccccccc', 'rivals', 'Bitter Enemies', 'After his betrayal, Cole becomes Jack nemesis.', 10, true, 'bbbbbbbb-0002-bbbb-bbbb-bbbbbbbbbbbb')
ON CONFLICT DO NOTHING;

-- Garrett -> Jack (hunts)
INSERT INTO public.story_edges (id, project_id, source_node_id, target_node_id, relationship_type, label, description, weight, is_bidirectional)
VALUES ('99999999-0008-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0006-cccc-cccc-cccccccccccc', 'cccccccc-0001-cccc-cccc-cccccccccccc', 'hunts', 'Pursuer', 'Garrett has made capturing Jack his life mission, driven by his brother death.', 10, false)
ON CONFLICT DO NOTHING;

-- Garrett -> Marshals (leads)
INSERT INTO public.story_edges (id, project_id, source_node_id, target_node_id, relationship_type, label, description, weight, is_bidirectional)
VALUES ('99999999-0009-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0006-cccc-cccc-cccccccccccc', 'ffffffff-0002-ffff-ffff-ffffffffffff', 'leads', 'Lead Investigator', 'Garrett leads the federal pursuit of the McAllister gang.', 9, false)
ON CONFLICT DO NOTHING;

-- Rosa -> Rebels (leads)
INSERT INTO public.story_edges (id, project_id, source_node_id, target_node_id, relationship_type, label, description, weight, is_bidirectional)
VALUES ('99999999-0010-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0007-cccc-cccc-cccccccccccc', 'ffffffff-0004-ffff-ffff-ffffffffffff', 'leads', 'Revolutionary Leader', 'Rosa commands the Delgado rebel force with fierce determination.', 10, false)
ON CONFLICT DO NOTHING;

-- Gang -> Eagle Nest (based at)
INSERT INTO public.story_edges (id, project_id, source_node_id, target_node_id, relationship_type, label, description, weight, is_bidirectional, valid_until_book_id)
VALUES ('99999999-0011-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ffffffff-0001-ffff-ffff-ffffffffffff', 'dddddddd-0001-dddd-dddd-dddddddddddd', 'based_at', 'Headquarters', 'The gang uses Eagle Nest as their primary hideout until Cole betrayal.', 9, false, 'bbbbbbbb-0001-bbbb-bbbb-bbbbbbbbbbbb')
ON CONFLICT DO NOTHING;

-- Copper -> Pinkertons (former member)
INSERT INTO public.story_edges (id, project_id, source_node_id, target_node_id, relationship_type, label, description, weight, is_bidirectional)
VALUES ('99999999-0012-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0009-cccc-cccc-cccccccccccc', 'ffffffff-0003-ffff-ffff-ffffffffffff', 'former_member', 'Turncoat', 'Copper defected from the Pinkertons after discovering their role in massacring miners.', 6, false)
ON CONFLICT DO NOTHING;

-- Mining Company -> Pinkertons (employs)
INSERT INTO public.story_edges (id, project_id, source_node_id, target_node_id, relationship_type, label, description, weight, is_bidirectional)
VALUES ('99999999-0013-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ffffffff-0005-ffff-ffff-ffffffffffff', 'ffffffff-0003-ffff-ffff-ffffffffffff', 'employs', 'Hired Enforcers', 'The mining company secretly employs Pinkertons for dirty work.', 8, false)
ON CONFLICT DO NOTHING;

-- Rebels -> Mining Company (enemies)
INSERT INTO public.story_edges (id, project_id, source_node_id, target_node_id, relationship_type, label, description, weight, is_bidirectional)
VALUES ('99999999-0014-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ffffffff-0004-ffff-ffff-ffffffffffff', 'ffffffff-0005-ffff-ffff-ffffffffffff', 'enemies', 'Revolutionary Target', 'The mining company represents everything the rebels are fighting against.', 10, true)
ON CONFLICT DO NOTHING;

-- Doc -> Gang (member)
INSERT INTO public.story_edges (id, project_id, source_node_id, target_node_id, relationship_type, label, description, weight, is_bidirectional)
VALUES ('99999999-0015-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0005-cccc-cccc-cccccccccccc', 'ffffffff-0001-ffff-ffff-ffffffffffff', 'member_of', 'Gang Medic', 'Doc serves as the gang medic and safecracker.', 8, false)
ON CONFLICT DO NOTHING;

-- Dan -> Gang (member)
INSERT INTO public.story_edges (id, project_id, source_node_id, target_node_id, relationship_type, label, description, weight, is_bidirectional)
VALUES ('99999999-0016-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0008-cccc-cccc-cccccccccccc', 'ffffffff-0001-ffff-ffff-ffffffffffff', 'member_of', 'Explosives Expert', 'Dan handles all demolition and explosive work for the gang.', 8, false)
ON CONFLICT DO NOTHING;

-- Hector -> Gang (member)
INSERT INTO public.story_edges (id, project_id, source_node_id, target_node_id, relationship_type, label, description, weight, is_bidirectional)
VALUES ('99999999-0017-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0010-cccc-cccc-cccccccccccc', 'ffffffff-0001-ffff-ffff-ffffffffffff', 'member_of', 'Horse Master', 'Hector manages the gang horses and serves as backup tracker.', 7, false)
ON CONFLICT DO NOTHING;

-- Jack -> Saber (owns)
INSERT INTO public.story_edges (id, project_id, source_node_id, target_node_id, relationship_type, label, description, weight, is_bidirectional)
VALUES ('99999999-0018-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0001-cccc-cccc-cccccccccccc', 'eeeeeeee-0001-eeee-eeee-eeeeeeeeeeee', 'owns', 'Heirloom', 'The saber is Jack most treasured possession, connecting him to his past.', 9, false)
ON CONFLICT DO NOTHING;

-- Garrett -> Watch (carries)
INSERT INTO public.story_edges (id, project_id, source_node_id, target_node_id, relationship_type, label, description, weight, is_bidirectional)
VALUES ('99999999-0019-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0006-cccc-cccc-cccccccccccc', 'eeeeeeee-0002-eeee-eeee-eeeeeeeeeeee', 'carries', 'Memorial', 'Garrett carries his brother watch as a constant reminder of his mission.', 10, false)
ON CONFLICT DO NOTHING;

-- Gang -> Robbery (participated in)
INSERT INTO public.story_edges (id, project_id, source_node_id, target_node_id, relationship_type, label, description, weight, is_bidirectional)
VALUES ('99999999-0020-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ffffffff-0001-ffff-ffff-ffffffffffff', 'a0a0a0a0-0001-a0a0-a0a0-a0a0a0a0a0a0', 'participated_in', 'The Heist', 'The train robbery that sets everything in motion.', 10, false)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- CHAPTERS AND SCENES: BOOK 1
-- ============================================================================

-- Chapter 1: The Take
INSERT INTO public.chapters (id, book_id, title, summary, sort_order, order_index, target_word_count)
VALUES (
  'aaaabbbb-0001-cccc-dddd-eeeeffffaaaa',
  'bbbbbbbb-0001-bbbb-bbbb-bbbbbbbbbbbb',
  'The Take',
  'The McAllister gang robs the Atchison Express. Despite Jack orders, Cole kills a guard—Daniel Garrett. The gang escapes with $40,000 but has made a powerful enemy.',
  1, 1, 8000
)
ON CONFLICT (id) DO NOTHING;

-- Scene 1.1: Valid scene_type values are: action, dialogue, introspection, exposition, transition, flashback
INSERT INTO public.scenes (id, chapter_id, title, beat_instructions, location_id, pov_character_id, scene_type, tension_level, mood, time_of_day, sort_order, order_index, target_word_count)
VALUES (
  'aaaabbbb-0001-aaaa-aaaa-aaaaaaaaaaaa',
  'aaaabbbb-0001-cccc-dddd-eeeeffffaaaa',
  'Waiting for the Train',
  'Open with the gang in position along the tracks at Apache Canyon. Establish the key players: Jack calm and commanding, Cole restless and eager, Elena watching from high ground, Dan checking his charges. Build tension as they wait. Show Jack professionalism and the gang discipline. End with the train whistle in the distance.',
  NULL,
  'cccccccc-0001-cccc-cccc-cccccccccccc',
  'exposition',
  'medium',
  'tense',
  'dawn',
  1, 1, 2000
)
ON CONFLICT (id) DO NOTHING;

-- Scene 1.2
INSERT INTO public.scenes (id, chapter_id, title, beat_instructions, location_id, pov_character_id, scene_type, tension_level, mood, time_of_day, sort_order, order_index, target_word_count)
VALUES (
  'aaaabbbb-0002-aaaa-aaaa-aaaaaaaaaaaa',
  'aaaabbbb-0001-cccc-dddd-eeeeffffaaaa',
  'The Robbery',
  'The heist in full swing. Dan blows the tracks, Jack talks down the conductor, Preacher covers the passengers. Focus on the professional efficiency until Cole finds a guard reaching for a hidden gun. Against Jack orders, Cole shoots him—it is Daniel Garrett. The moment shatters the clean operation. They grab the money and run.',
  'dddddddd-0007-dddd-dddd-dddddddddddd',
  'cccccccc-0001-cccc-cccc-cccccccccccc',
  'action',
  'high',
  'chaotic',
  'morning',
  2, 2, 3000
)
ON CONFLICT (id) DO NOTHING;

-- Scene 1.3
INSERT INTO public.scenes (id, chapter_id, title, beat_instructions, location_id, pov_character_id, scene_type, tension_level, mood, time_of_day, sort_order, order_index, target_word_count)
VALUES (
  'aaaabbbb-0003-aaaa-aaaa-aaaaaaaaaaaa',
  'aaaabbbb-0001-cccc-dddd-eeeeffffaaaa',
  'The Escape',
  'The gang rides hard for the mountains. Jack confronts Cole about the killing—their first real conflict. Elena scouts ahead, spots cavalry on the horizon. They push the horses to their limits. End with them reaching the safety of the mountain trails, but Jack knows this job has cost them more than they realize.',
  NULL,
  'cccccccc-0003-cccc-cccc-cccccccccccc',
  'action',
  'high',
  'urgent',
  'morning',
  3, 3, 3000
)
ON CONFLICT (id) DO NOTHING;

-- Chapter 2: Eagle Nest
INSERT INTO public.chapters (id, book_id, title, summary, sort_order, order_index, target_word_count)
VALUES (
  'aaaabbbb-0002-cccc-dddd-eeeeffffaaaa',
  'bbbbbbbb-0001-bbbb-bbbb-bbbbbbbbbbbb',
  'Eagle Nest',
  'The gang reaches their hideout and divides the take. We learn about each member backstory and their dynamics. Meanwhile, Marshal Garrett receives news of his brother death and swears vengeance.',
  2, 2, 10000
)
ON CONFLICT (id) DO NOTHING;

-- Scene 2.1
INSERT INTO public.scenes (id, chapter_id, title, beat_instructions, location_id, pov_character_id, scene_type, tension_level, mood, time_of_day, sort_order, order_index, target_word_count)
VALUES (
  'aaaabbbb-0004-aaaa-aaaa-aaaaaaaaaaaa',
  'aaaabbbb-0002-cccc-dddd-eeeeffffaaaa',
  'Home Ground',
  'Arrival at Eagle Nest. Describe the hideout in detail through Jack eyes—its defensive advantages, the comfort of familiar ground. The gang relaxes, celebrates cautiously. Jack walks the perimeter, thinking about what went wrong. Preacher joins him, offers spiritual counsel. Jack admits he is tired.',
  'dddddddd-0001-dddd-dddd-dddddddddddd',
  'cccccccc-0001-cccc-cccc-cccccccccccc',
  'introspection',
  'low',
  'reflective',
  'evening',
  1, 1, 3000
)
ON CONFLICT (id) DO NOTHING;

-- Scene 2.2
INSERT INTO public.scenes (id, chapter_id, title, beat_instructions, location_id, pov_character_id, scene_type, tension_level, mood, time_of_day, sort_order, order_index, target_word_count)
VALUES (
  'aaaabbbb-0005-aaaa-aaaa-aaaaaaaaaaaa',
  'aaaabbbb-0002-cccc-dddd-eeeeffffaaaa',
  'Dividing the Take',
  'The ritual of splitting the money. Flashbacks reveal how each member joined the gang. Tensions between Cole and others surface. Elena and Jack share a loaded look—their history unspoken but present. End with Jack announcing they will lay low for three months.',
  'dddddddd-0001-dddd-dddd-dddddddddddd',
  'cccccccc-0005-cccc-cccc-cccccccccccc',
  'dialogue',
  'medium',
  'mixed',
  'night',
  2, 2, 4000
)
ON CONFLICT (id) DO NOTHING;

-- Scene 2.3: Cut to Garrett
INSERT INTO public.scenes (id, chapter_id, title, beat_instructions, location_id, pov_character_id, scene_type, tension_level, mood, time_of_day, sort_order, order_index, target_word_count)
VALUES (
  'aaaabbbb-0006-aaaa-aaaa-aaaaaaaaaaaa',
  'aaaabbbb-0002-cccc-dddd-eeeeffffaaaa',
  'A Brother Oath',
  'POV shift to Marshal Thomas Garrett. He receives the telegram about Daniel death. We see his controlled grief, his methodical nature as he begins gathering information. He takes Daniel pocket watch, winds it, and swears he will bring in every member of the McAllister gang. A worthy antagonist is established.',
  NULL,
  'cccccccc-0006-cccc-cccc-cccccccccccc',
  'introspection',
  'medium',
  'grief',
  'afternoon',
  3, 3, 3000
)
ON CONFLICT (id) DO NOTHING;

-- Chapter 3: The Long Winter
INSERT INTO public.chapters (id, book_id, title, summary, sort_order, order_index, target_word_count)
VALUES (
  'aaaabbbb-0003-cccc-dddd-eeeeffffaaaa',
  'bbbbbbbb-0001-bbbb-bbbb-bbbbbbbbbbbb',
  'The Long Winter',
  'Months pass at Eagle Nest. The gang deals with cabin fever, internal tensions, and the growing threat of Garrett investigation. Cole grows more volatile. Jack and Elena dance around their feelings.',
  3, 3, 12000
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- BOOK CHARACTERS
-- ============================================================================

-- Book 1 Characters
INSERT INTO public.book_characters (book_id, node_id, role_in_book, is_pov_character)
VALUES
  ('bbbbbbbb-0001-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0001-cccc-cccc-cccccccccccc', 'protagonist', true),
  ('bbbbbbbb-0001-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0002-cccc-cccc-cccccccccccc', 'deuteragonist', true),
  ('bbbbbbbb-0001-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0003-cccc-cccc-cccccccccccc', 'main', true),
  ('bbbbbbbb-0001-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0004-cccc-cccc-cccccccccccc', 'supporting', false),
  ('bbbbbbbb-0001-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0005-cccc-cccc-cccccccccccc', 'supporting', true),
  ('bbbbbbbb-0001-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0006-cccc-cccc-cccccccccccc', 'antagonist', true),
  ('bbbbbbbb-0001-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0008-cccc-cccc-cccccccccccc', 'supporting', false),
  ('bbbbbbbb-0001-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0009-cccc-cccc-cccccccccccc', 'supporting', false),
  ('bbbbbbbb-0001-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0010-cccc-cccc-cccccccccccc', 'supporting', false)
ON CONFLICT DO NOTHING;

-- Book 2 Characters
INSERT INTO public.book_characters (book_id, node_id, role_in_book, is_pov_character)
VALUES
  ('bbbbbbbb-0002-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0001-cccc-cccc-cccccccccccc', 'protagonist', true),
  ('bbbbbbbb-0002-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0003-cccc-cccc-cccccccccccc', 'main', true),
  ('bbbbbbbb-0002-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0007-cccc-cccc-cccccccccccc', 'deuteragonist', true),
  ('bbbbbbbb-0002-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0005-cccc-cccc-cccccccccccc', 'supporting', false),
  ('bbbbbbbb-0002-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0006-cccc-cccc-cccccccccccc', 'antagonist', true),
  ('bbbbbbbb-0002-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0002-cccc-cccc-cccccccccccc', 'antagonist', false),
  ('bbbbbbbb-0002-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0008-cccc-cccc-cccccccccccc', 'supporting', false),
  ('bbbbbbbb-0002-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0009-cccc-cccc-cccccccccccc', 'supporting', false),
  ('bbbbbbbb-0002-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0010-cccc-cccc-cccccccccccc', 'supporting', false)
ON CONFLICT DO NOTHING;

-- Book 3 Characters
INSERT INTO public.book_characters (book_id, node_id, role_in_book, is_pov_character)
VALUES
  ('bbbbbbbb-0003-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0001-cccc-cccc-cccccccccccc', 'protagonist', true),
  ('bbbbbbbb-0003-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0007-cccc-cccc-cccccccccccc', 'deuteragonist', true),
  ('bbbbbbbb-0003-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0003-cccc-cccc-cccccccccccc', 'main', true),
  ('bbbbbbbb-0003-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0006-cccc-cccc-cccccccccccc', 'ally', true),
  ('bbbbbbbb-0003-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0002-cccc-cccc-cccccccccccc', 'antagonist', false),
  ('bbbbbbbb-0003-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0005-cccc-cccc-cccccccccccc', 'supporting', false),
  ('bbbbbbbb-0003-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-0008-cccc-cccc-cccccccccccc', 'supporting', false)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SCENE CHARACTERS
-- ============================================================================

-- Scene 1.1 Characters
INSERT INTO public.scene_characters (scene_id, character_id, node_id, role_in_scene, pov)
VALUES
  ('aaaabbbb-0001-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0001-cccc-cccc-cccccccccccc', 'cccccccc-0001-cccc-cccc-cccccccccccc', 'POV, commander', true),
  ('aaaabbbb-0001-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0002-cccc-cccc-cccccccccccc', 'cccccccc-0002-cccc-cccc-cccccccccccc', 'restless lieutenant', false),
  ('aaaabbbb-0001-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0003-cccc-cccc-cccccccccccc', 'cccccccc-0003-cccc-cccc-cccccccccccc', 'scout on high ground', false),
  ('aaaabbbb-0001-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0008-cccc-cccc-cccccccccccc', 'cccccccc-0008-cccc-cccc-cccccccccccc', 'checking charges', false)
ON CONFLICT DO NOTHING;

-- Scene 1.2 Characters
INSERT INTO public.scene_characters (scene_id, character_id, node_id, role_in_scene, pov)
VALUES
  ('aaaabbbb-0002-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0001-cccc-cccc-cccccccccccc', 'cccccccc-0001-cccc-cccc-cccccccccccc', 'POV, leader', true),
  ('aaaabbbb-0002-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0002-cccc-cccc-cccccccccccc', 'cccccccc-0002-cccc-cccc-cccccccccccc', 'shooter', false),
  ('aaaabbbb-0002-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0004-cccc-cccc-cccccccccccc', 'cccccccc-0004-cccc-cccc-cccccccccccc', 'crowd control', false),
  ('aaaabbbb-0002-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0008-cccc-cccc-cccccccccccc', 'cccccccc-0008-cccc-cccc-cccccccccccc', 'explosives', false),
  ('aaaabbbb-0002-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0005-cccc-cccc-cccccccccccc', 'cccccccc-0005-cccc-cccc-cccccccccccc', 'safecracker', false)
ON CONFLICT DO NOTHING;

-- Scene 1.3 Characters
INSERT INTO public.scene_characters (scene_id, character_id, node_id, role_in_scene, pov)
VALUES
  ('aaaabbbb-0003-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0003-cccc-cccc-cccccccccccc', 'cccccccc-0003-cccc-cccc-cccccccccccc', 'POV, scout', true),
  ('aaaabbbb-0003-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0001-cccc-cccc-cccccccccccc', 'cccccccc-0001-cccc-cccc-cccccccccccc', 'leader confronting Cole', false),
  ('aaaabbbb-0003-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0002-cccc-cccc-cccccccccccc', 'cccccccc-0002-cccc-cccc-cccccccccccc', 'defensive', false)
ON CONFLICT DO NOTHING;

-- Scene 2.1 Characters
INSERT INTO public.scene_characters (scene_id, character_id, node_id, role_in_scene, pov)
VALUES
  ('aaaabbbb-0004-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0001-cccc-cccc-cccccccccccc', 'cccccccc-0001-cccc-cccc-cccccccccccc', 'POV, reflective', true),
  ('aaaabbbb-0004-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0004-cccc-cccc-cccccccccccc', 'cccccccc-0004-cccc-cccc-cccccccccccc', 'spiritual counsel', false)
ON CONFLICT DO NOTHING;

-- Scene 2.2 Characters
INSERT INTO public.scene_characters (scene_id, character_id, node_id, role_in_scene, pov)
VALUES
  ('aaaabbbb-0005-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0005-cccc-cccc-cccccccccccc', 'cccccccc-0005-cccc-cccc-cccccccccccc', 'POV, observer', true),
  ('aaaabbbb-0005-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0001-cccc-cccc-cccccccccccc', 'cccccccc-0001-cccc-cccc-cccccccccccc', 'distributing money', false),
  ('aaaabbbb-0005-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0002-cccc-cccc-cccccccccccc', 'cccccccc-0002-cccc-cccc-cccccccccccc', 'tension source', false),
  ('aaaabbbb-0005-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0003-cccc-cccc-cccccccccccc', 'cccccccc-0003-cccc-cccc-cccccccccccc', 'loaded looks with Jack', false)
ON CONFLICT DO NOTHING;

-- Scene 2.3 Characters
INSERT INTO public.scene_characters (scene_id, character_id, node_id, role_in_scene, pov)
VALUES
  ('aaaabbbb-0006-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-0006-cccc-cccc-cccccccccccc', 'cccccccc-0006-cccc-cccc-cccccccccccc', 'POV, grief-stricken', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DONE! The Outlaw Trail seed data loaded successfully.
-- ============================================================================
