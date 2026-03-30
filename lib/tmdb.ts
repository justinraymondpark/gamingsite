const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export type TMDBMovie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  genre_ids: number[];
  vote_average: number;
};

export type TMDBTVShow = {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  genre_ids: number[];
  vote_average: number;
};

export type TMDBSearchResult = {
  id: number;
  title: string;
  type: 'movie' | 'tv';
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string;
  overview: string;
  voteAverage: number;
};

// Genre ID → name mappings (from TMDB)
const MOVIE_GENRES: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance',
  878: 'Sci-Fi', 10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
};

const TV_GENRES: Record<number, string> = {
  10759: 'Action & Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 10762: 'Kids', 9648: 'Mystery',
  10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap',
  10767: 'Talk', 10768: 'War & Politics', 37: 'Western',
};

function getImageUrl(path: string | null, size: string = 'w500'): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getGenreNames(genreIds: number[], type: 'movie' | 'tv'): string[] {
  const genres = type === 'movie' ? MOVIE_GENRES : TV_GENRES;
  return genreIds.map(id => genres[id]).filter(Boolean);
}

export async function searchMovies(queryStr: string): Promise<TMDBSearchResult[]> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(queryStr)}&page=1`
    );

    if (!response.ok) throw new Error('Failed to search movies');

    const data = await response.json();
    return (data.results as TMDBMovie[]).slice(0, 10).map((movie) => ({
      id: movie.id,
      title: movie.title,
      type: 'movie' as const,
      posterUrl: getImageUrl(movie.poster_path),
      backdropUrl: getImageUrl(movie.backdrop_path, 'w1280'),
      releaseDate: movie.release_date || '',
      overview: movie.overview,
      voteAverage: movie.vote_average,
    }));
  } catch (error) {
    console.error('Error searching movies:', error);
    return [];
  }
}

export async function searchTV(queryStr: string): Promise<TMDBSearchResult[]> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(queryStr)}&page=1`
    );

    if (!response.ok) throw new Error('Failed to search TV shows');

    const data = await response.json();
    return (data.results as TMDBTVShow[]).slice(0, 10).map((show) => ({
      id: show.id,
      title: show.name,
      type: 'tv' as const,
      posterUrl: getImageUrl(show.poster_path),
      backdropUrl: getImageUrl(show.backdrop_path, 'w1280'),
      releaseDate: show.first_air_date || '',
      overview: show.overview,
      voteAverage: show.vote_average,
    }));
  } catch (error) {
    console.error('Error searching TV shows:', error);
    return [];
  }
}

export async function getMovieDetails(id: number): Promise<{
  genres: string[];
  runtime: number | null;
  director: string;
  cast: string[];
} | null> {
  try {
    const [movieRes, creditsRes] = await Promise.all([
      fetch(`${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}`),
      fetch(`${TMDB_BASE_URL}/movie/${id}/credits?api_key=${TMDB_API_KEY}`),
    ]);

    if (!movieRes.ok) return null;

    const movie = await movieRes.json();
    const credits = creditsRes.ok ? await creditsRes.json() : { crew: [], cast: [] };

    const director = credits.crew?.find((c: any) => c.job === 'Director')?.name || '';
    const cast = (credits.cast || []).slice(0, 5).map((c: any) => c.name);

    return {
      genres: (movie.genres || []).map((g: any) => g.name),
      runtime: movie.runtime || null,
      director,
      cast,
    };
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return null;
  }
}

export async function getTVDetails(id: number): Promise<{
  genres: string[];
  seasons: number;
  cast: string[];
} | null> {
  try {
    const [tvRes, creditsRes] = await Promise.all([
      fetch(`${TMDB_BASE_URL}/tv/${id}?api_key=${TMDB_API_KEY}`),
      fetch(`${TMDB_BASE_URL}/tv/${id}/credits?api_key=${TMDB_API_KEY}`),
    ]);

    if (!tvRes.ok) return null;

    const show = await tvRes.json();
    const credits = creditsRes.ok ? await creditsRes.json() : { cast: [] };

    return {
      genres: (show.genres || []).map((g: any) => g.name),
      seasons: show.number_of_seasons || 0,
      cast: (credits.cast || []).slice(0, 5).map((c: any) => c.name),
    };
  } catch (error) {
    console.error('Error fetching TV details:', error);
    return null;
  }
}
