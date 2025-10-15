const RAWG_API_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY || '';
const RAWG_BASE_URL = 'https://api.rawg.io/api';

export type RAWGGame = {
  id: number;
  name: string;
  background_image: string;
  released: string;
  rating: number;
  genres: { id: number; name: string }[];
  platforms: { platform: { id: number; name: string } }[];
  developers?: { id: number; name: string }[];
  metacritic?: number;
};

export type RAWGSearchResult = {
  count: number;
  results: RAWGGame[];
};

export async function searchGames(query: string): Promise<RAWGGame[]> {
  try {
    const response = await fetch(
      `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=10`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch games');
    }
    
    const data: RAWGSearchResult = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error searching games:', error);
    return [];
  }
}

export async function getGameDetails(id: number): Promise<RAWGGame | null> {
  try {
    const response = await fetch(
      `${RAWG_BASE_URL}/games/${id}?key=${RAWG_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch game details');
    }
    
    const data: RAWGGame = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching game details:', error);
    return null;
  }
}
