/*
  # Add pre-approval functionality

  1. New Tables
    - `pre_approvals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `monthly_income` (decimal)
      - `criminal_history` (boolean)
      - `eviction_history` (boolean)
      - `ideal_move_in` (date)
      - `video_url` (text, nullable)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Storage
    - Create bucket for pre-approval videos
    - Add policies for video upload and access

  3. Security
    - Enable RLS on pre_approvals table
    - Add policies for user access
*/

-- Create pre_approvals table
CREATE TABLE pre_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  monthly_income decimal NOT NULL,
  criminal_history boolean DEFAULT false,
  eviction_history boolean DEFAULT false,
  ideal_move_in date NOT NULL,
  video_url text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pre_approvals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own pre-approvals"
  ON pre_approvals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pre-approvals"
  ON pre_approvals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('pre-approval-videos', 'pre-approval-videos', true);

-- Add storage policies
CREATE POLICY "Videos are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pre-approval-videos');

CREATE POLICY "Users can upload videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pre-approval-videos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
