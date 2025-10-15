# GameLog - Your Personal Gaming Journal

A beautiful, custom-built gaming website where you can share your thoughts on games you're playing. Features both quick notes and longform reviews with automatic game metadata from RAWG API.

## ✨ Features

- 🎮 **Game Database Integration**: Search and add games with automatic box art, platforms, and metadata
- 📝 **Dual Content Types**:
  - Quick Notes: Twitter-style short thoughts (up to 280 characters)
  - Full Reviews: Longform with ratings, pros/cons, playtime, and Markdown support
- 🎨 **Unique Design**: Deep indigo base with electric lime accents for a distinctive gaming aesthetic
- 🔐 **Custom Admin CMS**: Web-based content management accessible at `/admin`
- 📱 **Responsive**: Beautiful on all screen sizes

## 🚀 Setup Instructions

### 1. Get Your API Keys

#### RAWG API (for game data)
1. Go to https://rawg.io/apidocs
2. Create a free account
3. Get your API key from the dashboard

#### Supabase (for database)
1. Go to https://supabase.com
2. Create a new project
3. Go to Project Settings → API
4. Copy your project URL and `anon` public key
5. Go to SQL Editor and run the schema from `supabase-schema.sql`

### 2. Configure Environment Variables

Edit the `.env.local` file and fill in your keys:

\`\`\`env
NEXT_PUBLIC_RAWG_API_KEY=your_rawg_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
ADMIN_PASSWORD=choose_a_secure_password
\`\`\`

### 3. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 4. Run Locally

\`\`\`bash
npm run dev
\`\`\`

Visit http://localhost:3000 to see your site!
Visit http://localhost:3000/admin to access the CMS.

## 📦 Deploy to Netlify

### Option 1: Deploy via GitHub (Recommended)

1. Push this code to a GitHub repository
2. Go to https://netlify.com and sign in
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repo
5. Add your environment variables in Netlify:
   - Go to Site settings → Environment variables
   - Add all variables from `.env.local`
6. Deploy!

### Option 2: Deploy via Netlify CLI

\`\`\`bash
npm install -g netlify-cli
netlify login
netlify init
netlify env:set NEXT_PUBLIC_RAWG_API_KEY your_key_here
netlify env:set NEXT_PUBLIC_SUPABASE_URL your_url_here
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY your_key_here
netlify env:set ADMIN_PASSWORD your_password_here
netlify deploy --prod
\`\`\`

## 🎯 Using the Admin Panel

1. Go to `/admin` on your deployed site
2. Enter your admin password
3. **Add Games**: Search RAWG database and add games to your collection
4. **Quick Notes**: Write short thoughts about games (280 chars max)
5. **Write Review**: Create detailed reviews with ratings, pros/cons, and Markdown formatting

## 🎨 Customization

### Colors
Edit `app/globals.css` to change the color scheme:
- `--background`: Main background color
- `--surface`: Card/panel backgrounds
- `--accent`: Primary accent color (currently lime green)

### Platforms
Edit the `PLATFORMS` array in `components/admin/ReviewForm.tsx` to add/remove gaming platforms.

## 📝 Markdown Support in Reviews

Reviews support Markdown formatting:
- `## Heading` for section titles
- `**bold**` for emphasis
- `*italic*` for subtle emphasis
- `- item` for bullet lists
- `1. item` for numbered lists

## 🛠 Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Supabase** - PostgreSQL database
- **RAWG API** - Game metadata
- **Netlify** - Hosting
- **React Markdown** - Review formatting

## 📄 License

MIT - Use this however you want!

---

Built with ❤️ for gamers who love to share their thoughts.
