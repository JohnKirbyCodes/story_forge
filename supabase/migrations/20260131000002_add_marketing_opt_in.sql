-- Add marketing_opt_in column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS marketing_opt_in boolean DEFAULT false;

-- Update the handle_new_user function to capture marketing preference
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, marketing_opt_in)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    COALESCE((new.raw_user_meta_data->>'marketing_opt_in')::boolean, false)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
