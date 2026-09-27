/*
# Create watchlist table for CineMatch

## Purpose
Stores movies/series that a signed-in user has saved to their watchlist.
Each row is owned by one user; users can only see and manage their own items.

## New Tables
- `watchlist`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users with cascade delete)
  - `movie_id` (integer, not null — the catalog/TMDB id of the saved title)
  - `media_type` (text, not null — 'movie' or 'tv')
  - `title` (text, not null)
  - `poster` (text — image URL)
  - `rating` (numeric — vote average)
  - `year` (text — release year or first air year)
  - `added_at` (timestamptz, defaults to now())
  - Unique constraint on (user_id, movie_id) so a title can only be saved once per user

## Security
- RLS enabled on `watchlist`.
- Four owner-scoped policies (select/insert/update/delete) scoped TO authenticated.
- `user_id` defaults to auth.uid() so frontend inserts that omit user_id succeed.
*/