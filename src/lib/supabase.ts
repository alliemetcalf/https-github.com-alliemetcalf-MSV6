import { createClient } from '@supabase/supabase-js';
import { generateSafeFileName } from './imageUtils';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please connect to Supabase using the "Connect to Supabase" button.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Test the connection and retry if needed
export async function testConnection(retries = 3, delay = 1000): Promise<boolean> {
  let lastError;
  while (retries > 0) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true })
        .limit(1);

      if (!error) {
        console.log('Successfully connected to Supabase');
        return true;
      }

      throw error;
    } catch (error) {
      lastError = error;
      console.warn(`Connection attempt failed (${retries} retries left):`, error);
      retries--;

      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }

  console.error('Failed to establish Supabase connection:', lastError);
  return false;
}

// Image upload function with improved error handling and retries
export async function uploadImage(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string | null> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit');
  }

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const filePath = `${userId}/${generateSafeFileName(file.name)}`;
      
      const { error: uploadError } = await supabase.storage
        .from('room-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
          duplex: 'half',
          onUploadProgress: (progress) => {
            onProgress?.(Math.round((progress.loaded / progress.total) * 100));
          }
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('room-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      lastError = error;
      console.error(`Upload attempt ${attempt} failed:`, error);

      if (error.message?.includes('new row violates row-level security')) {
        throw new Error('Permission denied. Please check your authentication status.');
      }

      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      }
    }
  }

  throw new Error(`Failed to upload file after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}

// Initialize connection test
testConnection().then(connected => {
  if (!connected) {
    console.error('Unable to establish Supabase connection after retries');
  }
});

// Export a function to check connection status
export async function checkConnection(): Promise<boolean> {
  return testConnection(1, 0);
}
