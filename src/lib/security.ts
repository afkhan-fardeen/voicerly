// Security utilities for Voicerly

export class SecurityUtils {
  // Validate and sanitize file names
  static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '')
      .replace(/\.{2,}/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .substring(0, 100); // Limit length
  }

  // Validate ID format to prevent path traversal
  static validateId(id: string): boolean {
    const idRegex = /^[a-zA-Z0-9_-]{1,10}$/;
    return idRegex.test(id);
  }

  // Validate audio file
  static validateAudioFile(file: File): { valid: boolean; error?: string } {
    const allowedExtensions = ['mp4', 'mp3', 'm4a', 'aac', 'webm', 'wav', 'ogg', 'flac'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    // Check file size
    if (file.size === 0) {
      return { valid: false, error: "File is empty" };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: "File too large. Maximum size is 10MB" };
    }
    
    // Check file extension (most reliable method)
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (!extension || !allowedExtensions.includes(extension)) {
      return { valid: false, error: "Invalid file extension. Only audio files are allowed" };
    }
    return { valid: true };
  }

  // Validate file header for additional security
  static validateAudioHeader(buffer: Buffer): boolean {
    const fileHeader = buffer.slice(0, 12);
    
    // Check for common audio file signatures
    const signatures = [
      // WebM
      () => fileHeader[0] === 0x1A && fileHeader[1] === 0x45,
      // MP4/M4A
      () => fileHeader[4] === 0x66 && fileHeader[5] === 0x74 && fileHeader[6] === 0x79 && fileHeader[7] === 0x70,
      // MP3
      () => fileHeader[0] === 0xFF && (fileHeader[1] & 0xE0) === 0xE0,
      // WAV
      () => fileHeader[0] === 0x52 && fileHeader[1] === 0x49 && fileHeader[2] === 0x46 && fileHeader[3] === 0x46,
      // OGG
      () => fileHeader[0] === 0x4F && fileHeader[1] === 0x67 && fileHeader[2] === 0x67 && fileHeader[3] === 0x53,
    ];

    return signatures.some(check => check());
  }

  // Escape HTML to prevent XSS
  static escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  // Generate secure random ID
  static generateSecureId(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }
}

