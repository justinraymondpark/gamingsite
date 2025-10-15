# Quick Setup Guide for GameLog

## Step 1: Set Up Supabase Database

1. Go to https://supabase.com and create a free account
2. Click "New Project" and fill in the details
3. Wait for the database to initialize (takes ~2 minutes)
4. Once ready, go to the SQL Editor (left sidebar)
5. Click "New Query"
6. Copy and paste the entire contents of `supabase-schema.sql` into the editor
7. Click "Run" to create all tables

## Step 2: Get Your API Keys

### Supabase Keys:
1. In Supabase, go to Project Settings (gear icon) → API
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string under "Project API keys")

### RAWG API Key:
1. Go to https://rawg.io/apidocs
2. Click "Get API Key" (top right)
3. Sign up for a free account
4. Your API key will be shown on the dashboard

## Step 3: Configure Your .env.local File

Open the `.env.local` file in your project and replace the placeholder values:

\`\`\`env
NEXT_PUBLIC_RAWG_API_KEY=paste_your_rawg_key_here
NEXT_PUBLIC_SUPABASE_URL=paste_your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_your_supabase_anon_key_here
ADMIN_PASSWORD=choose_a_strong_password_here
\`\`\`

**Important**: Don't share your `.env.local` file! It's already in `.gitignore`.

## Step 4: Install and Run

Open your terminal in the project folder and run:

\`\`\`bash
npm install
npm run dev
\`\`\`

## Step 5: Test It Out!

1. Open http://localhost:3000 in your browser
2. You should see an empty homepage (no content yet)
3. Go to http://localhost:3000/admin
4. Enter the password you set in `.env.local`
5. Try adding a game! Search for something like "Celeste" or "Hades"

## Troubleshooting

### "Failed to fetch games"
- Check that your RAWG API key is correct
- Make sure the key is active (check your RAWG dashboard)

### "Failed to add game" or database errors
- Verify your Supabase URL and key are correct
- Make sure you ran the SQL schema (Step 1)
- Check the Supabase logs: Project Settings → Logs

### Page won't load
- Make sure the development server is running (`npm run dev`)
- Try clearing your browser cache
- Check the terminal for error messages

## Next Steps

Once everything works locally:
1. Push your code to GitHub
2. Deploy to Netlify (see README.md for full instructions)
3. Add your environment variables in Netlify settings
4. Share your gaming thoughts with the world! 🎮

Need help? Check the full README.md for more details.
