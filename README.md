# Voicerly - A Vocaroo Clone

A modern voice recording and sharing application built with Next.js and Supabase. Record audio directly in your browser and share it with others instantly.

## Features

- 🎤 **Voice Recording**: Record audio directly in your browser using the Web Audio API
- 📤 **Instant Upload**: Upload recordings to Supabase Storage with automatic processing
- 🔗 **Easy Sharing**: Generate shareable links for your recordings
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices
- 🔒 **Secure**: Built with security best practices and rate limiting
- ⚡ **Fast**: Optimized for performance with Next.js 15

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Public access (no auth required)

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Supabase account

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd my-vocaroo-clone
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Follow the instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
   - Create a `.env.local` file with your Supabase credentials

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env.local` file in the root directory:

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

## Database Schema

The application uses a single `audio_files` table in Supabase with the following structure:

- `id` (UUID): Primary key
- `file_name` (VARCHAR): Unique filename
- `original_name` (VARCHAR): Original uploaded filename
- `file_size` (BIGINT): File size in bytes
- `mime_type` (VARCHAR): MIME type
- `storage_path` (TEXT): Path in Supabase Storage
- `created_at` (TIMESTAMP): Creation timestamp
- `download_count` (INTEGER): Download counter
- `is_active` (BOOLEAN): Active status

## API Endpoints

- `POST /api/upload` - Upload audio files
- `GET /api/cleanup` - Get file statistics
- `POST /api/cleanup` - Clean up expired files (with auth token)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
