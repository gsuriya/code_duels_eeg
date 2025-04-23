import { createClient } from '@supabase/supabase-js';
import * as functions from 'firebase-functions';

const supabaseUrl = functions.config().supabase.url;
const supabaseServiceKey = functions.config().supabase.service_key;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in Firebase config.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}); 