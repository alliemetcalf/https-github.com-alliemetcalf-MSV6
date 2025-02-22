-- Add video_url column to profiles table
ALTER TABLE profiles ADD COLUMN video_url text;

-- Create storage bucket for profile videos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-videos', 'profile-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Add storage policies for profile videos
CREATE POLICY "Profile videos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-videos');

CREATE POLICY "Users can upload their profile video"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-videos'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
