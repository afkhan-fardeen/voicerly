// Type definitions for Voicerly

export interface ErrorState {
  message: string;
  type: 'error' | 'warning' | 'info';
}

export interface UploadResponse {
  url: string;
  id: string;
  documentId: string;
  storageFileId: string;
}

export interface CleanupResponse {
  success: boolean;
  deletedCount: number;
  totalSizeDeleted: number;
  message: string;
}

export interface FileStatsResponse {
  totalFiles: number;
  totalSize: number;
  totalSizeMB: string;
  oldFiles: number;
  oldFilesSize: number;
  oldFilesSizeMB: string;
  maxAgeHours: number;
}

export interface MediaRecorderError extends Event {
  error: DOMException;
}

export interface AudioConstraints {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  sampleRate: number;
}

export interface RecordingState {
  isRecording: boolean;
  isUploading: boolean;
  hasError: boolean;
  errorMessage?: string;
}

export interface ShareOptions {
  shareLink: string | null;
  audioURL: string | null;
  showOptions: boolean;
}

// Supabase specific types
export interface AudioFileRecord {
  id: string;
  file_name: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  created_at: string;
  download_count: number;
  is_active: boolean;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  tableName: string;
  storageBucket: string;
}

