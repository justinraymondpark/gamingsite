// Shared types for the application

export type Game = {
  id: string; // Document ID (usually String(rawg_id))
  rawg_id: number;
  name: string;
  background_image: string;
  released: string;
  genres: string[];
  platforms: string[];
  created_at: string;
};

export type QuickNote = {
  id: string;
  game_id: string;
  content: string;
  images: string[];
  cover_image?: string;
  created_at: string;
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
  created_at: string;
  updated_at: string;
  game?: Game;
};
