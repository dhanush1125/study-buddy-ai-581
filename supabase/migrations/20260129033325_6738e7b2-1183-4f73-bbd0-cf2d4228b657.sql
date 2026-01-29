-- Add avatar_config column to user_preferences table to store avatar customization
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS avatar_config JSONB DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.user_preferences.avatar_config IS 'Stores the user custom avatar configuration (face, hair, eyes, accessories, colors)';