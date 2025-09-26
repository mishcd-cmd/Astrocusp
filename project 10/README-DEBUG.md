# Debug Script Instructions

⚠️ **IMPORTANT**: These debug scripts contain sensitive service role keys and should ONLY be run locally, never in browser environments like Bolt/StackBlitz.

## Why Scripts Fail in Browser

Scripts like `fixLiamBirthDate.js` will fail with "TypeError: fetch failed" when run in browser environments because:
- Browser security prevents direct database connections
- Service role keys cannot be used client-side
- Network requests to external APIs are restricted

## How to Run Locally

1. **Ensure you have Node.js installed** on your local machine

2. **Clone/download this project** to your local machine

3. **Create `.env.local`** in the project root with:
   ```
   SUPABASE_URL=https://fulzqbwojvrripsuoreh.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
   ```

4. **Install dependencies** locally:
   ```bash
   npm install
   ```

5. **Run the debug script**:
   ```bash
   # Check all users
   npx ts-node scripts/debugSubscription.js
   
   # Filter for specific user
   npx ts-node scripts/debugSubscription.js --email="tsharna"
   
   # Verify VIP accounts
   npx ts-node scripts/verifyVipAccounts.ts --email="mish.cd"
   
   # Fix Liam's birth date
   node scripts/fixLiamBirthDate.js
   ```

## What the Script Does

- Lists all auth users (admin access required)
- Shows user profiles in the database
- Displays Stripe customer mappings
- Shows subscription records
- Provides targeted diagnostics for specific users

## Security Note

The service role key has admin privileges and should never be exposed in client-side code or browser environments. Always run this script locally or in secure server environments only.