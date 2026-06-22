// ── Supabase Configuration ────────────────────────────────────
// 1. Create a free project at https://supabase.com
// 2. Dashboard → Settings → API
// 3. Paste your "Project URL" and "anon public" key below
// 4. Run supabase-schema.sql in the Supabase SQL Editor first
// ─────────────────────────────────────────────────────────────

const SUPABASE_URL      = 'https://ofgggclyliouuocgoovj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZ2dnY2x5bGlvdXVvY2dvb3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NzQxMjksImV4cCI6MjA5NzI1MDEyOX0._bHm63JNEKUVHxl4bRTkKBzzOhVUNxlVG9xt6EluNTE';

const _supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
