// Firebase client configuration for browser-side operations
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, query, where, orderBy, limit, getDocs, getDoc, addDoc, updateDoc, deleteDoc, Timestamp, DocumentData } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage, collection, doc, query, where, orderBy, limit, getDocs, getDoc, addDoc, updateDoc, deleteDoc, Timestamp, ref, uploadBytes, getDownloadURL, deleteObject };

// Type definitions matching the Supabase schema
export type Game = {
  id: string;
  rawg_id: number;
  name: string;
  background_image: string;
  released: string;
  genres: string[];
  platforms: string[];
  created_at: Date;
};

export type QuickNote = {
  id: string;
  game_id: string;
  content: string;
  images: string[];
  cover_image?: string;
  created_at: Date;
  game?: Game;
};

export type Review = {
  id: string;
  game_id: string;
  title: string;
  content: string;
  rating: number;
  platforms_played: string[];
  playtime_hours?: number;
  pros?: string[];
  cons?: string[];
  images: string[];
  cover_image?: string;
  created_at: Date;
  updated_at: Date;
  game?: Game;
};

// Helper function to convert Firestore timestamps to Date objects
export const convertTimestamp = (data: DocumentData) => {
  const converted: any = { ...data };
  if (converted.created_at?.toDate) {
    converted.created_at = converted.created_at.toDate();
  }
  if (converted.updated_at?.toDate) {
    converted.updated_at = converted.updated_at.toDate();
  }
  return converted;
};

// Database helper functions
export const firestoreHelpers = {
  // Get all games
  async getGames(): Promise<Game[]> {
    const gamesRef = collection(db, 'games');
    const q = query(gamesRef, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamp(doc.data())
    } as Game));
  },

  // Get game by ID
  async getGameById(id: string): Promise<Game | null> {
    const gameRef = doc(db, 'games', id);
    const gameSnap = await getDoc(gameRef);
    if (!gameSnap.exists()) return null;
    return {
      id: gameSnap.id,
      ...convertTimestamp(gameSnap.data())
    } as Game;
  },

  // Get game by RAWG ID
  async getGameByRawgId(rawgId: number): Promise<Game | null> {
    const gamesRef = collection(db, 'games');
    const q = query(gamesRef, where('rawg_id', '==', rawgId), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...convertTimestamp(doc.data())
    } as Game;
  },

  // Add a new game
  async addGame(gameData: Omit<Game, 'id' | 'created_at'>): Promise<Game> {
    const gamesRef = collection(db, 'games');
    const docRef = await addDoc(gamesRef, {
      ...gameData,
      created_at: Timestamp.now()
    });
    const newDoc = await getDoc(docRef);
    return {
      id: docRef.id,
      ...convertTimestamp(newDoc.data()!)
    } as Game;
  },

  // Get recent quick notes with game data
  async getRecentQuickNotes(limitCount: number = 10): Promise<QuickNote[]> {
    const notesRef = collection(db, 'quick_notes');
    const q = query(notesRef, orderBy('created_at', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    
    const notes = await Promise.all(
      snapshot.docs.map(async (noteDoc) => {
        const noteData = convertTimestamp(noteDoc.data());
        const game = noteData.game_id ? await this.getGameById(noteData.game_id) : null;
        return {
          id: noteDoc.id,
          ...noteData,
          game
        } as QuickNote;
      })
    );
    
    return notes;
  },

  // Get quick notes for a specific game
  async getQuickNotesByGameId(gameId: string): Promise<QuickNote[]> {
    const notesRef = collection(db, 'quick_notes');
    const q = query(notesRef, where('game_id', '==', gameId), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamp(doc.data())
    } as QuickNote));
  },

  // Get quick note by ID
  async getQuickNoteById(id: string): Promise<QuickNote | null> {
    const noteRef = doc(db, 'quick_notes', id);
    const noteSnap = await getDoc(noteRef);
    if (!noteSnap.exists()) return null;
    
    const noteData = convertTimestamp(noteSnap.data());
    const game = noteData.game_id ? await this.getGameById(noteData.game_id) : null;
    
    return {
      id: noteSnap.id,
      ...noteData,
      game
    } as QuickNote;
  },

  // Add a quick note
  async addQuickNote(noteData: Omit<QuickNote, 'id' | 'created_at' | 'game'>): Promise<QuickNote> {
    const notesRef = collection(db, 'quick_notes');
    const docRef = await addDoc(notesRef, {
      ...noteData,
      created_at: Timestamp.now()
    });
    const newDoc = await getDoc(docRef);
    return {
      id: docRef.id,
      ...convertTimestamp(newDoc.data()!)
    } as QuickNote;
  },

  // Update a quick note
  async updateQuickNote(id: string, updates: Partial<QuickNote>): Promise<void> {
    const noteRef = doc(db, 'quick_notes', id);
    await updateDoc(noteRef, updates);
  },

  // Delete a quick note
  async deleteQuickNote(id: string): Promise<void> {
    const noteRef = doc(db, 'quick_notes', id);
    await deleteDoc(noteRef);
  },

  // Get recent reviews with game data
  async getRecentReviews(limitCount: number = 10): Promise<Review[]> {
    const reviewsRef = collection(db, 'reviews');
    const q = query(reviewsRef, orderBy('created_at', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    
    const reviews = await Promise.all(
      snapshot.docs.map(async (reviewDoc) => {
        const reviewData = convertTimestamp(reviewDoc.data());
        const game = reviewData.game_id ? await this.getGameById(reviewData.game_id) : null;
        return {
          id: reviewDoc.id,
          ...reviewData,
          game
        } as Review;
      })
    );
    
    return reviews;
  },

  // Get reviews for a specific game
  async getReviewsByGameId(gameId: string): Promise<Review[]> {
    const reviewsRef = collection(db, 'reviews');
    const q = query(reviewsRef, where('game_id', '==', gameId), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamp(doc.data())
    } as Review));
  },

  // Get review by ID
  async getReviewById(id: string): Promise<Review | null> {
    const reviewRef = doc(db, 'reviews', id);
    const reviewSnap = await getDoc(reviewRef);
    if (!reviewSnap.exists()) return null;
    
    const reviewData = convertTimestamp(reviewSnap.data());
    const game = reviewData.game_id ? await this.getGameById(reviewData.game_id) : null;
    
    return {
      id: reviewSnap.id,
      ...reviewData,
      game
    } as Review;
  },

  // Add a review
  async addReview(reviewData: Omit<Review, 'id' | 'created_at' | 'updated_at' | 'game'>): Promise<Review> {
    const reviewsRef = collection(db, 'reviews');
    const now = Timestamp.now();
    const docRef = await addDoc(reviewsRef, {
      ...reviewData,
      created_at: now,
      updated_at: now
    });
    const newDoc = await getDoc(docRef);
    return {
      id: docRef.id,
      ...convertTimestamp(newDoc.data()!)
    } as Review;
  },

  // Update a review
  async updateReview(id: string, updates: Partial<Review>): Promise<void> {
    const reviewRef = doc(db, 'reviews', id);
    await updateDoc(reviewRef, {
      ...updates,
      updated_at: Timestamp.now()
    });
  },

  // Delete a review
  async deleteReview(id: string): Promise<void> {
    const reviewRef = doc(db, 'reviews', id);
    await deleteDoc(reviewRef);
  },
};
