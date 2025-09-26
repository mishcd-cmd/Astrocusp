// scripts/debugSubscription.js
// Usage:
//   node scripts/debugSubscription.js
//   node scripts/debugSubscription.js --email="tsharna"   (optional filter)

require('dotenv').config();             // loads .env if present
require('dotenv').config({ path: '.env.local' }); // loads .env.local if present

const { createClient } = require('@supabase/supabase-js');

// Avoid duplicate declaration in browser environments
let createClientFunc;
try {
  ({ createClient: createClientFunc } = require('@supabase/supabase-js'));
} catch {
  // Fallback if already defined globally
  createClientFunc = globalThis.createClient || window?.supabase?.createClient;
}

// Prefer explicit server envs; fall back to Expo public URL if needed (read-only)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // REQUIRED (admin)

// Basic argv filter
const argEmail = (process.argv.find(a => a.startsWith('--email=')) || '').split('=')[1]?.toLowerCase()?.trim() || null;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('  SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'MISSING');
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? 'SET' : 'MISSING');
  console.error('\nPlease add to your .env.local (or environment):');
  console.error('  SUPABASE_URL=https://<your-project>.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=<service-role-key>');
  process.exit(1);
}

// IMPORTANT: service-role key is required for auth.admin APIs
const supabase = createClientFunc(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function debugSubscription() {
  console.log('🔍 Debugging subscription sync issue…\n');

  // 1) Auth users (admin)
  console.log('1) Checking auth users (admin)…');
  let authUsers = [];
  try {
    // listUsers supports pagination; for simplicity we fetch first N
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw error;
    authUsers = data?.users ?? [];
    console.log(`   ✅ Found ${authUsers.length} auth users`);
    if (argEmail) {
      const filtered = authUsers.filter(
        u => (u.email || '').toLowerCase().includes(argEmail)
      );
      console.log(`   🔎 Filter (--email=${argEmail}) matches: ${filtered.length}`);
      filtered.forEach(u => console.log(`     • ${u.email} (id: ${u.id})`));
    } else {
      authUsers.slice(0, 5).forEach(u => console.log(`     • ${u.email} (id: ${u.id})`));
      if (authUsers.length > 5) console.log('     … (truncated)');
    }
  } catch (e) {
    console.error('   ❌ Auth admin error:', e);
  }

  // 2) Profiles
  console.log('\n2) Checking user_profiles…');
  let profiles = [];
  try {
    const { data, error } = await supabase.from('user_profiles').select('*');
    if (error) throw error;
    profiles = data || [];
    console.log(`   ✅ Found ${profiles.length} profiles`);
    if (argEmail) {
      const p = profiles.filter(
        x =>
          (x.email || '').toLowerCase().includes(argEmail) ||
          (x.name || '').toLowerCase().includes(argEmail)
      );
      console.log(`   🔎 Filter matches: ${p.length}`);
      p.forEach(x => console.log(`     • ${x.email} (id: ${x.id})`));
    }
  } catch (e) {
    console.error('   ❌ Profiles error:', e);
  }

  // 3) Stripe customers mapping
  console.log('\n3) Checking stripe_customers…');
  let customers = [];
  try {
    const { data, error } = await supabase.from('stripe_customers').select('*');
    if (error) throw error;
    customers = data || [];
    console.log(`   ✅ Found ${customers.length} stripe_customers`);
    if (argEmail && authUsers.length) {
      const matchedAuthIds = authUsers
        .filter(u => (u.email || '').toLowerCase().includes(argEmail))
        .map(u => u.id);
      const matched = customers.filter(c => matchedAuthIds.includes(c.user_id));
      matched.forEach(c => console.log(`     • customer_id=${c.customer_id} (user_id: ${c.user_id})`));
      if (!matched.length) console.log('     • No customer mapping for that email filter.');
    }
  } catch (e) {
    console.error('   ❌ stripe_customers error:', e);
  }

  // 4) Subscriptions mirror
  console.log('\n4) Checking stripe_subscriptions…');
  let subs = [];
  try {
    const { data, error } = await supabase.from('stripe_subscriptions').select('*');
    if (error) throw error;
    subs = data || [];
    console.log(`   ✅ Found ${subs.length} subscriptions`);
    if (argEmail && authUsers.length) {
      const matchedAuthIds = authUsers
        .filter(u => (u.email || '').toLowerCase().includes(argEmail))
        .map(u => u.id);
      const matchedCustIds = customers
        .filter(c => matchedAuthIds.includes(c.user_id))
        .map(c => c.customer_id);
      const matchedSubs = subs.filter(s => matchedCustIds.includes(s.customer_id));
      matchedSubs.forEach(s =>
        console.log(
          `     • sub_id=${s.subscription_id} status=${s.status} price_id=${s.price_id} customer=${s.customer_id}`
        )
      );
      if (!matchedSubs.length) console.log('     • No subscription for that email filter.');
    }
  } catch (e) {
    console.error('   ❌ stripe_subscriptions error:', e);
  }

  // Optional targeted diagnostics for a specific person (by --email)
  console.log('\n5) Targeted diagnostics:');
  if (!argEmail) {
    console.log('   (Tip: run with --email="nameOrEmailPart" to focus on one user)');
  } else {
    const user = authUsers.find(u => (u.email || '').toLowerCase().includes(argEmail));
    if (!user) {
      console.log('   ❌ No auth user found for that email filter.');
    } else {
      console.log(`   ✅ Auth user: ${user.email} (id: ${user.id})`);
      const profile = profiles.find(p => p.id === user.id);
      console.log(`   📋 Profile: ${profile ? 'EXISTS' : 'MISSING'}`);
      const cust = customers.find(c => c.user_id === user.id);
      console.log(`   💳 Stripe customer: ${cust ? `EXISTS (${cust.customer_id})` : 'MISSING'}`);
      const sub = cust ? subs.find(s => s.customer_id === cust.customer_id) : null;
      console.log(
        `   🔄 Subscription: ${
          sub
            ? `EXISTS (status=${sub.status}, price_id=${sub.price_id}, current_period_end=${sub.current_period_end})`
            : 'MISSING'
        }`
      );

      console.log('\n   🔍 Diagnosis:');
      if (!profile) {
        console.log('   • Missing profile row. Ensure your signup flow inserts into user_profiles.');
      } else if (!cust) {
        console.log('   • No stripe_customers row. Your webhook that creates the mapping may not be firing.');
      } else if (!sub) {
        console.log('   • No stripe_subscriptions row for that customer. Check your invoice/subscription webhooks.');
      } else if (!['active', 'trialing'].includes(sub.status)) {
        console.log(`   • Subscription status is "${sub.status}". The app will treat this as inactive.`);
      } else {
        console.log('   • All rows exist and look healthy—check app logic that reads the mirror table.');
      }
    }
  }

  console.log('\n✅ Finished.\n');
}

debugSubscription();