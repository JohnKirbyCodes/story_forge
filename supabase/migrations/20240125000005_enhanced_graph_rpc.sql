-- Migration: Enhanced get_connected_subgraph RPC function
-- Returns full node attributes and edge importance for AI context

-- Drop the existing function and recreate with enhanced return type
drop function if exists get_connected_subgraph(uuid, uuid[], integer, uuid);

create or replace function get_connected_subgraph(
  p_project_id uuid,
  p_focus_node_ids uuid[],
  p_depth integer default 2,
  p_current_book_id uuid default null
)
returns table (
  -- Node fields
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
  -- Edge fields
  edge_id uuid,
  edge_type text,
  edge_label text,
  edge_description text,
  edge_weight integer,
  edge_is_bidirectional boolean,
  -- Graph traversal
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

  -- Recursive case: traverse edges
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
    -- Filter by book timeline validity if provided
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

comment on function get_connected_subgraph is 'Traverses the knowledge graph from focus nodes, returning full node attributes and edge importance for AI context building';
