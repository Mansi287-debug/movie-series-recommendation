export type Category = 'Movies' | 'Series';

export type MediaType = 'movie' | 'tv';

export type Mood = 'Relaxed' | 'Excited' | 'Romantic' | 'Focused' | 'Surprised';

export type Duration = 'Under 30 min' | '30–60 min' | '1–2 hours' | '2+ hours';

export type Movie = {
  id: number;
  title: string;
  year: string;
  genres: string[];
  rating: number;
  duration: number;
  media_type: MediaType;
  category: Category;
  overview: string;
  tagline: string;
  cast: string[];
  director: string;
  poster: string;
  backdrop: string;
  moods: Mood[];
  tag: string;
};

export type WatchlistItem = {
  id: string;
  user_id: string;
  movie_id: number;
  media_type: string;
  title: string;
  poster: string | null;
  rating: number | null;
  year: string | null;
  added_at: string;
};
