# GameLog - Personal Gaming Journal

A personal gaming journal for writing quick notes and longform reviews about games. Game metadata pulled from RAWG API, data stored in Firestore, hosted as a static site on Firebase.

## Features

- **Game search** via RAWG API with automatic box art, platforms, and metadata
- **Quick notes** for short thoughts on games
- **Full reviews** with ratings, pros/cons, playtime tracking, and Markdown
- **Game pages** that aggregate all notes and reviews per game
- **Admin CMS** at `/admin` with Google OAuth authentication
- **Static export** — fully client-side, no server required

## Setup

### Prerequisites

- A Firebase project with Firestore, Authentication (Google provider), and Storage enabled
- A [RAWG API key](https://rawg.io/apidocs)

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_RAWG_API_KEY=your_rawg_api_key
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_ADMIN_EMAIL=your_google_email@gmail.com
```

### Install and Run

```bash
npm install
npm run dev
```

## Deploy

The site builds as a static export (`output: 'export'`) into `out/`, served by Firebase Hosting with an SPA rewrite.

```bash
npm run build
firebase deploy
```

Or use the shorthand:

```bash
npm run deploy
```

## Tech Stack

- **Next.js 16** (static export) — React framework with App Router
- **TypeScript**
- **Tailwind CSS 4**
- **Firebase** — Firestore, Auth, Storage, Hosting
- **RAWG API** — game metadata
- **React Markdown** — review formatting
