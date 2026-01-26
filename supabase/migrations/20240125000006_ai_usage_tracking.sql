-- AI Usage Tracking Table
-- Tracks token usage, costs, and model information for all AI API calls

CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL,
  scene_id UUID REFERENCES scenes(id) ON DELETE SET NULL,

  -- AI Request Details
  endpoint TEXT NOT NULL, -- e.g., 'generate-outline', 'generate-scene', 'edit-prose'
  model TEXT NOT NULL, -- e.g., 'claude-sonnet-4-20250514'

  -- Token Usage
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,

  -- Cost Tracking (in USD cents for precision)
  input_cost_cents NUMERIC(10, 4) DEFAULT 0,
  output_cost_cents NUMERIC(10, 4) DEFAULT 0,
  total_cost_cents NUMERIC(10, 4) GENERATED ALWAYS AS (input_cost_cents + output_cost_cents) STORED,

  -- Request Metadata
  request_duration_ms INTEGER, -- How long the request took
  status TEXT DEFAULT 'success', -- 'success', 'error', 'cancelled'
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX idx_ai_usage_project_id ON ai_usage(project_id);
CREATE INDEX idx_ai_usage_created_at ON ai_usage(created_at);
CREATE INDEX idx_ai_usage_endpoint ON ai_usage(endpoint);
CREATE INDEX idx_ai_usage_model ON ai_usage(model);

-- RLS Policies
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Users can only view their own usage
CREATE POLICY "Users can view own usage"
  ON ai_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Only server (service role) can insert usage records
CREATE POLICY "Service role can insert usage"
  ON ai_usage FOR INSERT
  WITH CHECK (true);

-- Create a view for aggregated usage statistics
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

-- Grant access to the view
GRANT SELECT ON user_ai_usage_summary TO authenticated;

COMMENT ON TABLE ai_usage IS 'Tracks AI API usage including tokens, costs, and performance metrics';
