/*
# Create watchlist table for CineMatch

## Purpose
Stores movies/series that a signed-in user has saved to their watchlist.
Each row is owned by one user; users can only see and manage their own items.

## New Tables
- `watchlist`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users with cascade delete)
  - `movie_id` (integer, not null)
  - `media_type` (text, not null — 'movie' or 'tv')
  - `title` (text, not null)
  - `poster` (text)
  - `rating` (numeric)
  - `year` (text)
  - `added_at` (timestamptz, defaults to now())
  - Unique constraint on (user_id, movie_id)

## Security
- RLS enabled on `watchlist`.
- Four owner-scoped policies scoped TO authenticated.
- user_id defaults to auth.uid().
*/

CREATE TABLE IF NOT EXISTS watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id integer NOT NULL,
  media_type text NOT NULL DEFAULT 'movie',
  title text NOT NULL,
  poster text,
  rating numeric,
  year text,
  added_at timestamptz DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_watchlist" ON watchlist;
CREATE POLICY "select_own_watchlist" ON watchlist FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_watchlist" ON watchlist;
CREATE POLICY "insert_own_watchlist" ON watchlist FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_watchlist" ON watchlist;
CREATE POLICY "update_own_watchlist" ON watchlist FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_watchlist" ON watchlist;
CREATE POLICY "delete_own_watchlist" ON watchlist FOR DELETE
  TO authenticated USING (auth.uid() = user_id);