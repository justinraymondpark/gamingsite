# Netlify Deployment Setup

## Required Environment Variables

To deploy this site on Netlify, you **must** configure the following environment variables in your Netlify project settings:

### Step 1: Go to Netlify Environment Variables

1. Log in to [Netlify](https://app.netlify.com)
2. Select your site
3. Go to **Site configuration** → **Environment variables**
4. Click **Add a variable** for each of the following:

### Step 2: Add These Variables

#### NEXT_PUBLIC_RAWG_API_KEY
- **Value**: Your RAWG API key
- Get it from: https://rawg.io/apidocs
- This is used to search for games and fetch game metadata

#### NEXT_PUBLIC_SUPABASE_URL
- **Value**: Your Supabase project URL
- Get it from: https://supabase.com/dashboard → Your Project → Settings → API
- Format: `https://xxxxx.supabase.co`

#### NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Value**: Your Supabase anonymous/public key
- Get it from: https://supabase.com/dashboard → Your Project → Settings → API
- This is the `anon` / `public` key (NOT the service_role key)

#### ADMIN_PASSWORD
- **Value**: Your chosen admin password
- This is used to access the `/admin` CMS interface
- Choose a secure password

### Step 3: Redeploy

After adding all environment variables:
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait for the build to complete

## Build Settings

Your `netlify.toml` is already configured with:
- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: 20

## Troubleshooting

### Error: "supabaseUrl is required"
- You haven't set the `NEXT_PUBLIC_SUPABASE_URL` environment variable
- Make sure the variable name is **exactly** `NEXT_PUBLIC_SUPABASE_URL` (case-sensitive)

### Error: "Failed to collect page data"
- One or more environment variables are missing
- Double-check all four variables are set in Netlify

### Build succeeds but site doesn't work
- Make sure you've completed the Supabase setup (see `SETUP.md`)
- Run the database migrations from `supabase-schema.sql` and `supabase-migration-*.sql`
- Configure Supabase Storage policies from `supabase-storage-policies.sql`
