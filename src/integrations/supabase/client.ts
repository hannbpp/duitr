import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { mockSupabase } from '../../lib/mockSupabase';

// Check if we want to run offline with local mock supabase
const useMock = import.meta.env.VITE_USE_MOCK_SUPABASE === 'true';

// Use environment variables - fail fast if not provided
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables if not in mock mode
if (!useMock && (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY)) {
  throw new Error(
    'Missing required environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = useMock
  ? (mockSupabase as any)
  : createClient<Database>(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!);