// Migration script using Firebase client SDK
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAvl1k0TNAw0x6lI3cHK6C990EBNbErQNY",
  authDomain: "gamingsite-toupee.firebaseapp.com",
  projectId: "gamingsite-toupee",
  storageBucket: "gamingsite-toupee.firebasestorage.app",
  messagingSenderId: "309284125390",
  appId: "1:309284125390:web:7e953e3126e548e754ee9f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Data from Supabase
const games = [
  {"id":1,"rawg_id":868087,"name":"Silent Hill f","background_image":"https://media.rawg.io/media/games/e7f/e7f2f571761abd7b3c0598c719ae8893.jpg","released":"2025-09-24","genres":["Adventure","Action"],"platforms":["PC","PlayStation 5","Xbox Series S/X"],"created_at":"2025-10-15T03:25:25.536007+00:00"},
  {"id":2,"rawg_id":57519,"name":"Super Mario World 2: Yoshi's Island","background_image":"https://media.rawg.io/media/games/98d/98d8fbc56c9a322a84ee38128e487bc8.jpg","released":"1995-08-05","genres":["Platformer"],"platforms":["SNES"],"created_at":"2025-10-15T04:52:12.089664+00:00"},
  {"id":3,"rawg_id":1004299,"name":"Ninja Gaiden: Ragebound","background_image":"https://media.rawg.io/media/games/40c/40c911198ddaf503afa3a9674199b906.jpg","released":"2025-07-31","genres":["Indie","Platformer","Adventure","Action"],"platforms":["PC","PlayStation 5","Xbox One","PlayStation 4","Xbox Series S/X","Nintendo Switch"],"created_at":"2025-10-15T05:11:17.217158+00:00"},
  {"id":4,"rawg_id":1010539,"name":"Megabonk","background_image":"https://media.rawg.io/media/screenshots/613/6130b543d602e53693c96f0e6d11aa7e.jpg","released":"2025-09-18","genres":["Casual","Indie","Action"],"platforms":["PC","Linux"],"created_at":"2025-10-16T04:34:58.884172+00:00"},
  {"id":5,"rawg_id":795429,"name":"Keeper","background_image":"https://media.rawg.io/media/games/c25/c250345e67f1a8db503e542ab4c80c2c.jpg","released":"2025-10-17","genres":["Indie","Adventure","Action"],"platforms":["PC"],"created_at":"2025-10-24T03:57:19.502127+00:00"},
  {"id":6,"rawg_id":1008166,"name":"Ball x Pit","background_image":"https://media.rawg.io/media/games/798/798705b4f25e958e4ab8edf570e215f8.jpg","released":"2025-10-15","genres":["Indie","Action"],"platforms":["PC","Nintendo Switch","macOS"],"created_at":"2025-10-27T04:02:04.408311+00:00"},
  {"id":7,"rawg_id":1007483,"name":"Battlefield 6","background_image":"https://media.rawg.io/media/games/dcc/dcc38d78ab1f1a90fdc4ba1bea3a73ff.jpg","released":"2025-10-10","genres":["Shooter","Action"],"platforms":["PC","PlayStation 5","Xbox Series S/X"],"created_at":"2025-10-31T03:16:02.371069+00:00"},
  {"id":8,"rawg_id":1010400,"name":"Hyrule Warriors: Age of Imprisonment","background_image":"https://media.rawg.io/media/games/480/4801940e86df11f8aa92b3c988fe92fc.jpg","released":"2025-11-06","genres":["Action"],"platforms":["Nintendo Switch"],"created_at":"2025-11-08T04:11:20.766123+00:00"},
  {"id":9,"rawg_id":1008987,"name":"Morsels","background_image":"https://media.rawg.io/media/games/595/595f0ce5b55a784878f422253729c03d.jpg","released":"2025-11-18","genres":["Action"],"platforms":["PC","Nintendo Switch"],"created_at":"2025-11-20T18:48:37.889606+00:00"},
  {"id":10,"rawg_id":1000580,"name":"Kirby Air Riders","background_image":"https://media.rawg.io/media/games/083/0839770a3c15e3e6edf658fe2a5cc830.jpg","released":"2025-11-20","genres":["Adventure","Action"],"platforms":["Nintendo Switch"],"created_at":"2025-11-20T18:49:05.445289+00:00"}
];

const quickNotes = [
  {"id":1,"game_id":1,"content":"okay this is neat","created_at":"2025-10-15T03:25:36.454575+00:00","images":[],"cover_image":null},
  {"id":3,"game_id":2,"content":"testing that high refresh CRT shader","created_at":"2025-10-15T04:52:30.020572+00:00","images":["https://fiyiogmzkecdtpkjplon.supabase.co/storage/v1/object/public/screenshots/1760503941716-yxxoyog.jpg"],"cover_image":null},
  {"id":2,"game_id":1,"content":"interesting does this allow me to have more than one then....?","created_at":"2025-10-15T03:32:23.817785+00:00","images":["https://fiyiogmzkecdtpkjplon.supabase.co/storage/v1/object/public/screenshots/1760500770115-t83lkd.png"],"cover_image":null},
  {"id":4,"game_id":4,"content":"it fun","created_at":"2025-10-16T04:35:03.574365+00:00","images":[],"cover_image":null},
  {"id":5,"game_id":5,"content":"if microsoft is smart they will keep letting double fine produce docu-series. the fact that lee petty's name is on this is testament to the power of it - and GOOD JOB LEE PETTY (AND TEAM)!!","created_at":"2025-10-24T03:58:11.297736+00:00","images":[],"cover_image":null},
  {"id":6,"game_id":5,"content":"so glad to see that unique camera angles are BACK, baby. also the music/sound design in this game is wildly good","created_at":"2025-10-24T04:11:09.371739+00:00","images":[],"cover_image":null},
  {"id":7,"game_id":5,"content":"is your game really text-free if there's verbose achievements, tho?","created_at":"2025-10-24T04:17:22.999441+00:00","images":[],"cover_image":null},
  {"id":8,"game_id":6,"content":"it's fun, love the aesthetic, great progression and i like the loop hero/actraiser interlude between levels, good variety of mechanics (a ton of them!). not sure i love that you can adjust the speed arbitrarily, makes the slower ones feel kind of arbitrary but going faster is odd","created_at":"2025-10-27T04:04:55.666223+00:00","images":[],"cover_image":null},
  {"id":9,"game_id":7,"content":"bout to play with my bud!!!!!","created_at":"2025-10-31T03:16:09.702228+00:00","images":[],"cover_image":null},
  {"id":10,"game_id":8,"content":"i was kinda hoping it would feel more like vampire survivors, i know, that's on me","created_at":"2025-11-08T04:11:35.485219+00:00","images":[],"cover_image":null},
  {"id":11,"game_id":9,"content":"alright i love the aesthetic of this game and the music is great. pretty fun too","created_at":"2025-11-20T18:48:54.699001+00:00","images":[],"cover_image":null},
  {"id":12,"game_id":10,"content":"alright yup this is fun","created_at":"2025-11-20T18:49:11.963983+00:00","images":[],"cover_image":null}
];

const reviews = [
  {"id":1,"game_id":1,"title":"testing the review feature","content":"kjsdf sakdjf lksjdf lkasjdflkjsad flkjasdf lkjasdflk jasdflkjsad lkfjsdlkj fsdf\nsdflkjsadflkjasdlkfjsdf\nsdflkjasdflkjasdlkfjasdlkjfasdf\nklsdjflkasjdflkajsdf kjlsdf\nsadlkfjasldk jflskdjf\nsadklfj laskdjf lkasjdf","rating":9,"platforms_played":["PC","Xbox One"],"playtime_hours":10.0,"pros":[],"cons":[],"created_at":"2025-10-15T03:26:24.203214+00:00","updated_at":"2025-10-15T04:13:55.264+00:00","images":["https://fiyiogmzkecdtpkjplon.supabase.co/storage/v1/object/public/screenshots/1760500461524-1vbd5.png","https://fiyiogmzkecdtpkjplon.supabase.co/storage/v1/object/public/screenshots/1760500462691-hw59pg.png","https://fiyiogmzkecdtpkjplon.supabase.co/storage/v1/object/public/screenshots/1760500463479-q7rsfg.png","https://fiyiogmzkecdtpkjplon.supabase.co/storage/v1/object/public/screenshots/1760500466974-jzl02.png","https://fiyiogmzkecdtpkjplon.supabase.co/storage/v1/object/public/screenshots/1760500467907-cwtdw9.png","https://fiyiogmzkecdtpkjplon.supabase.co/storage/v1/object/public/screenshots/1760500469766-qc14ai.png"],"cover_image":"https://fiyiogmzkecdtpkjplon.supabase.co/storage/v1/object/public/screenshots/1760500463479-q7rsfg.png"},
  {"id":2,"game_id":3,"title":"fun sidescroller, spirit of the OG","content":"blah blah blah blah balflka flkaf lkajflkjalkfjasf","rating":7,"platforms_played":[],"playtime_hours":null,"pros":[],"cons":[],"created_at":"2025-10-15T05:11:50.755359+00:00","updated_at":"2025-10-15T05:11:50.755359+00:00","images":[],"cover_image":null}
];

// Map old game_id to rawg_id
const gameIdToRawgId = new Map();
games.forEach(g => gameIdToRawgId.set(g.id, g.rawg_id));

async function migrate() {
  console.log('Starting migration to Firebase...\n');

  // Migrate games
  console.log('Migrating games...');
  for (const game of games) {
    const docId = game.rawg_id.toString();
    await setDoc(doc(db, 'games', docId), {
      rawg_id: game.rawg_id,
      name: game.name,
      background_image: game.background_image,
      released: game.released,
      genres: game.genres,
      platforms: game.platforms,
      created_at: Timestamp.fromDate(new Date(game.created_at))
    });
    console.log(`  ✓ ${game.name}`);
  }

  // Migrate quick notes
  console.log('\nMigrating quick notes...');
  for (const note of quickNotes) {
    const rawgId = gameIdToRawgId.get(note.game_id);
    if (!rawgId) {
      console.log(`  ✗ Skipping note ${note.id}`);
      continue;
    }
    await setDoc(doc(db, 'quick_notes', note.id.toString()), {
      game_id: rawgId.toString(),
      content: note.content,
      images: note.images || [],
      cover_image: note.cover_image || null,
      created_at: Timestamp.fromDate(new Date(note.created_at))
    });
    console.log(`  ✓ Note ${note.id}`);
  }

  // Migrate reviews
  console.log('\nMigrating reviews...');
  for (const review of reviews) {
    const rawgId = gameIdToRawgId.get(review.game_id);
    if (!rawgId) {
      console.log(`  ✗ Skipping review ${review.id}`);
      continue;
    }
    await setDoc(doc(db, 'reviews', review.id.toString()), {
      game_id: rawgId.toString(),
      title: review.title,
      content: review.content,
      rating: review.rating,
      platforms_played: review.platforms_played || [],
      playtime_hours: review.playtime_hours || null,
      pros: review.pros || [],
      cons: review.cons || [],
      images: review.images || [],
      cover_image: review.cover_image || null,
      created_at: Timestamp.fromDate(new Date(review.created_at)),
      updated_at: Timestamp.fromDate(new Date(review.updated_at))
    });
    console.log(`  ✓ Review: ${review.title}`);
  }

  console.log('\n✅ Migration complete!');
  console.log(`   Games: ${games.length}`);
  console.log(`   Quick Notes: ${quickNotes.length}`);
  console.log(`   Reviews: ${reviews.length}`);
  
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
