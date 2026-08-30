# Supabase setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and fill in its Supabase values locally.
3. Install the Supabase CLI, authenticate, and link this directory to the project.
4. Apply the migration with `supabase db push`.

The migration creates the four Resume Screener tables, indexes, timestamp triggers, RLS, and a private `resumes` storage bucket. It intentionally creates no browser-access policies: public candidate submission and protected admin access will be introduced with their respective server-side flows in later phases.
