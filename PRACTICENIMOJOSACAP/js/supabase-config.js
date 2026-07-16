// ── Supabase Configuration ────────────────────────────────────
// 1. Create a free project at https://supabase.com
// 2. Dashboard → Settings → API
// 3. Paste your "Project URL" and "anon public" key below
// 4. Run supabase-schema.sql in the Supabase SQL Editor first
// ─────────────────────────────────────────────────────────────

const SUPABASE_URL      = 'https://ruclytedzkdbranurfcq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1Y2x5dGVkemtkYnJhbnVyZmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTcxMzIsImV4cCI6MjA5Mjk5MzEzMn0.z305A53Hda8xxCeTCpzfrkRGUgnaMO3YPt2rFgZDi4A';

const _supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
