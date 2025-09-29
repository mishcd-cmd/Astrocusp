// utils/sessionReady.ts
import { supabase } from './supabase';

let checked = false;

/** Call this once at app start so refreshes don't "flash logout". */
export async function waitForInitialSession() {
  if (checked) return;
  checked = true;
  const { data } = await supabase.auth.getSession();
  console.log('🔍 [session] initial session:', !!data.session);
}
