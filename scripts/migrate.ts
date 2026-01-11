import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, addDoc } from 'firebase/firestore';

// Load env vars
dotenv.config({ path: '.env.local' });

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
  console.log('Starting migration...');

  // 1. Fetch Games from Supabase
  console.log('Fetching games from Supabase...');
  const { data: games, error: gamesError } = await supabase.from('games').select('*');

  if (gamesError) {
    console.error('Error fetching games:', gamesError);
    return;
  }

  console.log(`Found ${games.length} games.`);

  const oldGameIdToNewId: Record<number, string> = {};

  for (const game of games) {
    const newId = String(game.rawg_id);
    oldGameIdToNewId[game.id] = newId;

    console.log(`Migrating game: ${game.name} (${newId})`);

    await setDoc(doc(db, 'games', newId), {
      rawg_id: game.rawg_id,
      name: game.name,
      background_image: game.background_image,
      released: game.released,
      genres: game.genres,
      platforms: game.platforms,
      created_at: game.created_at || new Date().toISOString(),
    });
  }

  // 2. Fetch Quick Notes
  console.log('Fetching quick notes from Supabase...');
  const { data: notes, error: notesError } = await supabase.from('quick_notes').select('*');

  if (notesError) {
    console.error('Error fetching notes:', notesError);
  } else {
    console.log(`Found ${notes.length} notes.`);
    for (const note of notes) {
      const newGameId = oldGameIdToNewId[note.game_id];
      if (!newGameId) {
        console.warn(`Skipping note ${note.id}: Game ID ${note.game_id} not found.`);
        continue;
      }

      console.log(`Migrating note ${note.id} for game ${newGameId}`);
      await addDoc(collection(db, 'quick_notes'), {
        game_id: newGameId,
        content: note.content,
        images: note.images,
        cover_image: note.cover_image,
        created_at: note.created_at || new Date().toISOString(),
      });
    }
  }

  // 3. Fetch Reviews
  console.log('Fetching reviews from Supabase...');
  const { data: reviews, error: reviewsError } = await supabase.from('reviews').select('*');

  if (reviewsError) {
    console.error('Error fetching reviews:', reviewsError);
  } else {
    console.log(`Found ${reviews.length} reviews.`);
    for (const review of reviews) {
      const newGameId = oldGameIdToNewId[review.game_id];
      if (!newGameId) {
        console.warn(`Skipping review ${review.id}: Game ID ${review.game_id} not found.`);
        continue;
      }

      console.log(`Migrating review ${review.id} for game ${newGameId}`);
      await addDoc(collection(db, 'reviews'), {
        game_id: newGameId,
        title: review.title,
        content: review.content,
        rating: review.rating,
        platforms_played: review.platforms_played,
        playtime_hours: review.playtime_hours,
        pros: review.pros,
        cons: review.cons,
        images: review.images,
        cover_image: review.cover_image,
        created_at: review.created_at || new Date().toISOString(),
        updated_at: review.updated_at || new Date().toISOString(),
      });
    }
  }

  console.log('Migration complete! 🎉');
  process.exit(0);
}

migrate().catch(console.error);
