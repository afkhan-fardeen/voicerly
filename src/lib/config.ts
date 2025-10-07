// Configuration file for Voicerly
export const config = {
  // File upload limits
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFilesPerHour: 10,
  
  // File cleanup settings
  fileCleanupMaxAge: 24 * 60 * 60 * 1000, // 24 hours
  
  // Allowed audio MIME types (prioritize more compatible formats)
  allowedAudioTypes: [
    'audio/mp4',
    'audio/mpeg',
    'audio/m4a',
    'audio/aac',
    'audio/webm',
    'audio/wav',
    'audio/ogg',
    'audio/flac'
  ],
  
  // Allowed file extensions (prioritize more compatible formats)
  allowedExtensions: ['mp4', 'mp3', 'm4a', 'aac', 'webm', 'wav', 'ogg', 'flac'],
  
  // Security settings
  enableRateLimiting: true,
  enableFileCleanup: true,
  
  // UI settings
  errorDisplayDuration: 5000, // 5 seconds
  recordingChunkInterval: 1000, // 1 second
};

