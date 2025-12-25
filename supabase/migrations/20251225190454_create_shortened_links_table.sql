/*
  # Create shortened_links table for URL shortener app

  1. New Tables
    - `shortened_links`
      - `id` (uuid, primary key) - unique identifier
      - `user_id` (uuid, foreign key to auth.users) - link owner
      - `original_url` (text) - the long URL
      - `short_url` (text) - the short URL with provider
      - `alias` (text) - custom alias/slug
      - `provider` (text) - the shortening service used
      - `summary` (text) - AI-generated summary of the URL
      - `created_at` (timestamp) - creation time
      - `updated_at` (timestamp) - last update time

  2. Security
    - Enable RLS on `shortened_links` table
    - Users can only read their own links
    - Users can only create links for themselves
    - Users can only update their own links
    - Users can only delete their own links
    - Enforce user_id ownership in all operations
*/

CREATE TABLE IF NOT EXISTS shortened_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_url text NOT NULL,
  short_url text NOT NULL,
  alias text NOT NULL,
  provider text NOT NULL,
  summary text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE shortened_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own links"
  ON shortened_links
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create links"
  ON shortened_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own links"
  ON shortened_links
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own links"
  ON shortened_links
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_shortened_links_user_id ON shortened_links(user_id);
CREATE INDEX IF NOT EXISTS idx_shortened_links_created_at ON shortened_links(created_at DESC);