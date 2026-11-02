-- Only needed when the CRM database is connected.
-- Replaces the Supabase Auth user FK with the simple account name for new activities.
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS user_name text;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='activities' AND column_name='user_id') THEN
   ALTER TABLE public.activities ALTER COLUMN user_id DROP NOT NULL;
 END IF;
END $$;
-- Keep older records; newly logged calls will save 'onur' or 'semih' in user_name.
