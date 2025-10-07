# Supabase Database Setup Guide for Voicerly

This guide will help you set up Supabase database and storage for your Vocaroo clone application.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Your project deployed or ready for deployment

## Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) and sign in
2. Click "New Project"
3. Enter project name: `Voicerly`
4. Choose your preferred region
5. Set a strong database password
6. Click "Create new project"

## Step 2: Get Project Credentials

1. In your project dashboard, go to Settings > API
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **Anon Key** (public key for client-side operations)

## Step 3: Create Database Table

Run the following SQL in the Supabase SQL Editor:

```sql
-- Create audio_files table
CREATE TABLE audio_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  download_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Create indexes for better performance
CREATE INDEX idx_audio_files_file_name ON audio_files(file_name);
CREATE INDEX idx_audio_files_is_active ON audio_files(is_active);
CREATE INDEX idx_audio_files_created_at ON audio_files(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to active files
CREATE POLICY "Allow public read access to active files" ON audio_files
  FOR SELECT USING (is_active = true);

-- Create policy to allow public insert (for uploads)
CREATE POLICY "Allow public insert" ON audio_files
  FOR INSERT WITH CHECK (true);

-- Create policy to allow public update (for download count)
CREATE POLICY "Allow public update download count" ON audio_files
  FOR UPDATE USING (true)
  WITH CHECK (true);
```

## Step 4: Create Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Click "Create a new bucket"
3. Bucket name: `audio-storage`
4. Make it **public** (uncheck "Private bucket")
5. Click "Create bucket"

## Step 5: Configure Storage Policies

Run the following SQL in the Supabase SQL Editor:

```sql
-- Allow public read access to storage
CREATE POLICY "Allow public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'audio-storage');

-- Allow public upload to storage
CREATE POLICY "Allow public upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'audio-storage');

-- Allow public update to storage
CREATE POLICY "Allow public update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'audio-storage')
  WITH CHECK (bucket_id = 'audio-storage');
```

## Step 6: Environment Variables

Create a `.env.local` file in your project root with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
CLEANUP_TOKEN=your_cleanup_token_here

# File upload limits
MAX_FILE_SIZE=10485760
MAX_FILES_PER_HOUR=10
FILE_CLEANUP_MAX_AGE=86400000
```

## Step 7: Test the Setup

1. Run `npm run dev` to start the development server
2. Test the audio upload functionality
3. Check your Supabase dashboard to verify files are being stored correctly

## Important Notes:

1. **Files are permanent** - they won't expire automatically
2. **Public access** - no authentication required for uploads/downloads
3. **Row Level Security** is enabled for additional security
4. **Storage policies** allow public access to the audio-storage bucket

## Database Schema

The `audio_files` table has the following structure:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, auto-generated |
| file_name | VARCHAR(255) | Unique filename for the audio file |
| original_name | VARCHAR(255) | Original filename uploaded by user |
| file_size | BIGINT | File size in bytes |
| mime_type | VARCHAR(100) | MIME type of the audio file |
| storage_path | TEXT | Path to file in Supabase Storage |
| created_at | TIMESTAMP | When the record was created |
| download_count | INTEGER | Number of times file was downloaded |
| is_active | BOOLEAN | Whether the file is still active/available |
