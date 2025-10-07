import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table name
export const AUDIO_FILES_TABLE = 'audio_files';

// Interface for audio file records
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

// Server-side helper functions
export const createAudioRecord = async (data: Omit<AudioFileRecord, 'id' | 'created_at' | 'download_count'>) => {
  try {
    const { data: record, error } = await supabase
      .from(AUDIO_FILES_TABLE)
      .insert({
        file_name: data.file_name,
        original_name: data.original_name,
        file_size: data.file_size,
        mime_type: data.mime_type,
        storage_path: data.storage_path,
        is_active: data.is_active
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return record;
  } catch (error) {
    console.error('Error creating audio record:', error);
    throw error;
  }
};

export const getAudioRecord = async (fileId: string) => {
  try {
    const { data: record, error } = await supabase
      .from(AUDIO_FILES_TABLE)
      .select('*')
      .eq('id', fileId)
      .eq('is_active', true)
      .single();

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return record as AudioFileRecord;
  } catch (error) {
    console.error('Error getting audio record:', error);
    throw error;
  }
};

export const updateDownloadCount = async (fileId: string) => {
  try {
    // First get the current record
    const { data: currentRecord, error: fetchError } = await supabase
      .from(AUDIO_FILES_TABLE)
      .select('download_count')
      .eq('id', fileId)
      .single();

    if (fetchError) {
      throw new Error(`Supabase error: ${fetchError.message}`);
    }

    const newCount = (currentRecord.download_count || 0) + 1;

    // Update the download count
    const { error: updateError } = await supabase
      .from(AUDIO_FILES_TABLE)
      .update({ download_count: newCount })
      .eq('id', fileId);

    if (updateError) {
      throw new Error(`Supabase error: ${updateError.message}`);
    }

    return newCount;
  } catch (error) {
    console.error('Error updating download count:', error);
    throw error;
  }
};

export const findAudioRecordByFileName = async (fileNamePattern: string) => {
  try {
    const { data: records, error } = await supabase
      .from(AUDIO_FILES_TABLE)
      .select('*')
      .like('file_name', fileNamePattern)
      .eq('is_active', true)
      .limit(1);

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    if (!records || records.length === 0) {
      return null;
    }

    return records[0] as AudioFileRecord;
  } catch (error) {
    console.error('Error finding audio record:', error);
    throw error;
  }
};

export const getFileStats = async () => {
  try {
    const { data: records, error } = await supabase
      .from(AUDIO_FILES_TABLE)
      .select('file_size')
      .eq('is_active', true);

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    const allFiles = records || [];
    const totalSize = allFiles.reduce((sum: number, file: any) => sum + file.file_size, 0);

    return {
      totalFiles: allFiles.length,
      totalSize: totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      oldFiles: 0, // No old files since they don't expire
      oldFilesSize: 0,
      oldFilesSizeMB: "0.00",
      maxAgeHours: 0 // No expiration
    };
  } catch (error) {
    console.error('Error getting file stats:', error);
    throw error;
  }
};

export const deleteExpiredFiles = async () => {
  try {
    // Since we're making files permanent, this function now just returns stats
    const stats = await getFileStats();
    
    return {
      deletedCount: 0,
      totalSize: stats.totalSize,
      message: `No files deleted - all files are permanent. Total files: ${stats.totalFiles}, Total size: ${stats.totalSizeMB} MB`
    };
  } catch (error) {
    console.error('Error in cleanup function:', error);
    throw error;
  }
};

// Storage functions
export const uploadFileToStorage = async (file: File, fileName: string) => {
  try {
    const { data, error } = await supabase.storage
      .from('audio-storage')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Supabase Storage error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error uploading file to storage:', error);
    throw error;
  }
};

export const getStorageFileUrl = (storagePath: string) => {
  try {
    const { data } = supabase.storage
      .from('audio-storage')
      .getPublicUrl(storagePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error getting storage file URL:', error);
    throw error;
  }
};

// Delete audio record from database
export const deleteAudioRecord = async (recordId: string) => {
  try {
    const { error } = await supabase
      .from('audio_files')
      .delete()
      .eq('id', recordId);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting audio record:', error);
    throw error;
  }
};

// Delete file from storage
export const deleteFileFromStorage = async (storagePath: string) => {
  try {
    const { error } = await supabase.storage
      .from('audio-storage')
      .remove([storagePath]);

    if (error) {
      throw new Error(`Storage error: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting file from storage:', error);
    throw error;
  }
};