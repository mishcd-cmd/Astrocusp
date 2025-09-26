// scripts/verifyVipAccounts.ts
// Usage examples:
//   npx ts-node scripts/verifyVipAccounts.ts --email="mish.cd@gmail.com" --show
//   npx ts-node scripts/verifyVipAccounts.ts --email="mish.cd@gmail.com" --set-hemisphere="Southern"
//   npx ts-node scripts/verifyVipAccounts.ts --email="user@example.com" --set-hemisphere="Northern" --enforce-vip
//
// ENV required:
//   SUPABASE_URL  or  EXPO_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY  (service role)

import 'dotenv/config';
import minimist from 'minimist';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type Hemisphere = 'Northern' | 'Southern';
type AnyObj = Record<string, any>;

const argv = minimist(process.argv.slice(2), {
  string: ['email', 'set-hemisphere'],
  boolean: ['show', 'enforce-vip'],
  alias: { e: 'email' },
});

function die(msg: string): never {
  console.error(msg);
  process.exit(1);
}

// Minimal pretty print for PostgREST errors
function logSupabaseError(where: string, err: any) {
  console.error(`❌ ${where} failed:`, {
    message: err?.message,
    details: err?.details,
    hint: err?.hint,
    code: err?.code,
  });
}

function parseCuspResult(raw: any): AnyObj {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  if (typeof raw === 'object') return raw;
  return {};
}

// Try an upsert, and if Postgres complains that a column doesn't exist,
// strip that column and retry (useful when older schemas lack updated_at/needs_recalc)
async function resilientUpsert(
  supabase: SupabaseClient,
  table: string,
  payload: AnyObj,
  conflictTarget: 'user_id' | 'id',
): Promise<AnyObj | null> {
  // Attempt 1
  let attemptPayload = { ...payload };

  const tryUpsert = async () => {
    const { data, error } = await supabase
      .from(table)
      .upsert(attemptPayload, { onConflict: conflictTarget })
      .select('*')
      .maybeSingle();
    return { data, error };
  };

  let { data, error } = await tryUpsert();
  if (!error) return data;

  // If it's a "column does not exist" error, strip the offending column and retry.
  const msg: string = String(error?.message || '');
  const colMatch = msg.match(/column "([^"]+)" of relation/i) || msg.match(/record "new" has no field "([^"]+)"/i);
  if (colMatch?.[1]) {
    const badCol = colMatch[1];
    console.warn(`⚠️ Column "${badCol}" not found in schema. Retrying without it.`);
    delete attemptPayload[badCol];
    ({ data, error } = await tryUpsert());
    if (!error) return data;
  }

  // Still failing—surface details
  logSupabaseError('Upsert', error);
  return null;
}

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    die('Missing SUPABASE_URL (or EXPO_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY.');
  }

  const email = (argv['email'] || '').trim().toLowerCase();
  const setHemisphereRaw = (argv['set-hemisphere'] as string | undefined)?.trim();
  const justShow = !!argv['show'];
  const enforceVip = !!argv['enforce-vip'];

  if (!email) die('Pass --email="<user email>"');

  const setHemisphere = setHemisphereRaw as Hemisphere | undefined;
  if (setHemisphere && setHemisphere !== 'Northern' && setHemisphere !== 'Southern') {
    die('Invalid --set-hemisphere. Use "Northern" or "Southern".');
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Optional VIP gate
  const VIP_ACCOUNTS = [
    'mish.cd@gmail.com',
    'petermaricar@bigpond.com',
    'tsharna.kecek@gmail.com',
    'james.summerton@outlook.com',
    'xavier.cd@gmail.com',
    'xaviercd96@gmail.com',
    'adam.stead@techweave.co',
    'michael.p.r.orourke@gmail.com',
  ];
  if (enforceVip && !VIP_ACCOUNTS.includes(email)) {
    console.log(`⚠️ ${email} is not in the VIP list. Aborting because --enforce-vip is set.`);
    console.log('VIP accounts:', VIP_ACCOUNTS);
    return;
  }

  console.log(`🔎 Looking up auth user: ${email}`);
  const all = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (all.error) die(`Admin listUsers failed: ${all.error.message}`);

  const user = all.data.users.find((u: any) => (u.email || '').toLowerCase() === email);
  if (!user) die(`No auth user found for email: ${email}`);

  console.log('✅ Auth user:', { id: user.id, email: user.email });

  // Read current profile (if any)
  console.log('🔎 Reading user_profiles row…');
  const { data: prof, error: profErr } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profErr) {
    logSupabaseError('Read user_profiles', profErr);
    die(`Failed to read user_profiles for ${email}`);
  }

  if (justShow) {
    console.log('ℹ️ Current profile:', prof ?? '(no row)');
    return;
  }

  // Safe defaults for NOT NULL columns
  const nowIso = new Date().toISOString();
  const SAFE_BIRTH_DATE = '1900-01-01'; // YYYY-MM-DD
  const SAFE_BIRTH_TIME = '12:00';      // HH:MM
  const SAFE_BIRTH_LOCATION = 'Unknown';

  // Keep existing JSON, or use empty object (never null if JSONB NOT NULL)
  const cusp = parseCuspResult(prof?.cusp_result);

  // Build payload—avoid nulls in NOT NULL columns
  const payload: AnyObj = {
    // pick the unique constraint you actually have; 'user_id' is common
    user_id: user.id,

    email: user.email,
    name: prof?.name ?? (user.email?.split('@')[0] ?? 'User'),
    hemisphere: setHemisphere ?? prof?.hemisphere ?? 'Northern',
    cusp_result: cusp,

    birth_date: prof?.birth_date ?? SAFE_BIRTH_DATE,
    birth_time: prof?.birth_time ?? SAFE_BIRTH_TIME,
    birth_location: prof?.birth_location ?? SAFE_BIRTH_LOCATION,

    // lifecycle (some schemas don't have updated_at/needs_recalc; the upsert helper will gracefully drop them if missing)
    created_at: prof?.created_at ?? nowIso,
    updated_at: nowIso,

    // optional flags
    needs_recalc: prof?.needs_recalc ?? false,
    last_login_at: prof?.last_login_at ?? nowIso,
  };

  console.log('🛠️ Upserting user_profiles…', {
    changingHemisphereTo: setHemisphere ?? '(unchanged)',
  });

  const upserted = await resilientUpsert(supabase, 'user_profiles', payload, 'user_id');
  if (!upserted) die('Upsert ultimately failed (see error above).');

  console.log('✅ Done. Profile:', {
    email: upserted.email,
    hemisphere: upserted.hemisphere,
    hasCuspResult: !!upserted.cusp_result,
    birthDate: upserted.birth_date,
  });
}

main().catch((err) => {
  console.error('❌ Script failed:', err?.message || err);
  process.exit(1);
});