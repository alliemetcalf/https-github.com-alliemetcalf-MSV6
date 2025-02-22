/*
  # Create storage bucket for room images

  1. Storage
    - Create `room-images` bucket for storing room photos
  2. Security
    - Enable public access for viewing images
    - Allow authenticated users to upload images
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('room-images', 'room-images', true);

-- Policy to allow public access to view images
CREATE POLICY "Room images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'room-images');

-- Policy to allow authenticated users to upload images
CREATE POLICY "Users can upload room images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'room-images'
  AND auth.role() = 'authenticated'
);
