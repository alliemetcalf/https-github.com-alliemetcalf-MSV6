-- Create site_settings table
CREATE TABLE site_settings (
  id integer PRIMARY KEY DEFAULT 1,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for site assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Add storage policies
CREATE POLICY "Site assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

CREATE POLICY "Admins can upload site assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'site-assets'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'admin'
  )
);

-- Add RLS policies
CREATE POLICY "Anyone can view site settings"
ON site_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can update site settings"
ON site_settings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'admin'
  )
);

-- Insert default row
INSERT INTO site_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;
