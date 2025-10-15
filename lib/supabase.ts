import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Game = {
  id: number;
  rawg_id: number;
  name: string;
  background_image: string;
  released: string;
  genres: string[];
  platforms: string[];
  created_at: string;
};

export type QuickNote = {
  id: number;
  game_id: number;
  content: string;
  images: string[];
  cover_image?: string;
  created_at: string;
  game?: Game;
};

export type Review = {
  id: number;
  game_id: number;
  title: string;
  content: string;
  rating: number;
  platforms_played: string[];
  playtime_hours?: number;
  pros?: string[];
  cons?: string[];
  images: string[];
  cover_image?: string;
  created_at: string;
  updated_at: string;
  game?: Game;
};
