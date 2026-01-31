-- Add billing_cycle column to track monthly vs annual billing
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly'
CHECK (billing_cycle IN ('monthly', 'annual'));

-- Add comment for documentation
COMMENT ON COLUMN profiles.billing_cycle IS 'Billing cycle type: monthly ($7/mo) or annual ($60/yr)';
