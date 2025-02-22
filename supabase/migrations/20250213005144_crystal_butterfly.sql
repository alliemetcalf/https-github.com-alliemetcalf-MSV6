-- Update host profile with complete information
UPDATE profiles
SET
  preferred_name = 'Sarah',
  current_city = 'San Francisco',
  phone = '(415) 555-0123',
  picture_url = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80',
  about_host = '# About Me

I''m a dedicated property manager with over 5 years of experience in the San Francisco Bay Area. My properties are well-maintained and I take pride in creating comfortable living spaces for my tenants.

## My Hosting Style

- Quick response to maintenance requests (usually within 24 hours)
- Monthly property inspections to ensure everything is in top condition
- Flexible with move-in dates and lease terms
- Professional yet friendly approach to property management

## What I Look For in Tenants

- Responsible and respectful individuals
- Good communication
- Clean and tidy lifestyle
- Long-term rental preference (1+ years)'
WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- Update first tenant profile with complete information
UPDATE profiles
SET
  preferred_name = 'Mike',
  current_city = 'San Francisco',
  phone = '(415) 555-0456',
  monthly_income = 6500,
  desired_move_date = '2025-04-01',
  picture_url = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80',
  new_video_url = 'https://example.com/videos/mike-intro.webm'
WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d480';

-- Update second tenant profile with complete information
UPDATE profiles
SET
  preferred_name = 'Em',
  current_city = 'San Francisco',
  phone = '(415) 555-0789',
  monthly_income = 5800,
  desired_move_date = '2025-03-15',
  picture_url = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80',
  new_video_url = 'https://example.com/videos/emily-intro.webm'
WHERE id = 'f47ac10b-58cc-4372-a567-0e02b2c3d481';
