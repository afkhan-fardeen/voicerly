import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { 
  createAudioRecord,
  uploadFileToStorage
} from "@/lib/supabase";
import { config } from "@/lib/config";
import { SecurityUtils } from "@/lib/security";

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Use config values
const ALLOWED_AUDIO_TYPES = config.allowedAudioTypes;
const MAX_FILE_SIZE = config.maxFileSize;
const MAX_FILES_PER_HOUR = config.maxFilesPerHour;

function getRateLimitKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown';
  return ip;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(key);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + 3600000 }); // 1 hour
    return false;
  }
  
  if (userLimit.count >= MAX_FILES_PER_HOUR) {
    return true;
  }
  
  userLimit.count++;
  return false;
}


export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com'
        : 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(req);
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 10 uploads per hour." }, 
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Sanitize filename first
    const sanitizedName = SecurityUtils.sanitizeFileName(audioFile.name);
    
    // Determine file extension based on MIME type for better compatibility
    let fileExtension = "webm"; // default fallback
    
    if (audioFile.type.includes("mp4") || audioFile.type.includes("m4a")) {
      fileExtension = "mp4";
    } else if (audioFile.type.includes("webm")) {
      fileExtension = "webm";
    } else if (audioFile.type.includes("wav")) {
      fileExtension = "wav";
    } else if (audioFile.type.includes("ogg")) {
      fileExtension = "ogg";
    } else if (audioFile.type.includes("mp3") || audioFile.type.includes("mpeg")) {
      fileExtension = "mp3";
    } else if (audioFile.type.includes("aac")) {
      fileExtension = "aac";
    } else {
      // Try to get extension from filename
      const extFromName = sanitizedName.split(".").pop();
      if (extFromName && config.allowedExtensions.includes(extFromName)) {
        fileExtension = extFromName;
      }
    }
    
    // Create a new File object with the correct extension for validation
    const fileForValidation = new File([audioFile], `${sanitizedName.split('.')[0]}.${fileExtension}`, {
      type: audioFile.type || `audio/${fileExtension}`
    });
    
    // Validate file with the corrected extension
    const validation = SecurityUtils.validateAudioFile(fileForValidation);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    
    // Generate unique ID and filename
    const uniqueId = nanoid(10);
    const fileName = `${uniqueId}.${fileExtension}`;

    // Read file buffer
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    
    // Additional security: Check file header for audio files
    // Only validate if we have enough data and the file is not empty
    if (buffer.length > 12) {
      const fileHeader = buffer.slice(0, 12);
      const isValidAudioHeader = ALLOWED_AUDIO_TYPES.some(type => {
        if (type === 'audio/webm') return fileHeader[0] === 0x1A && fileHeader[1] === 0x45;
        if (type === 'audio/mp4' || type === 'audio/m4a') return fileHeader[4] === 0x66 && fileHeader[5] === 0x74 && fileHeader[6] === 0x79 && fileHeader[7] === 0x70;
        if (type === 'audio/mpeg') return fileHeader[0] === 0xFF && (fileHeader[1] & 0xE0) === 0xE0;
        if (type === 'audio/wav') return fileHeader[0] === 0x52 && fileHeader[1] === 0x49 && fileHeader[2] === 0x46 && fileHeader[3] === 0x46;
        if (type === 'audio/ogg') return fileHeader[0] === 0x4F && fileHeader[1] === 0x67 && fileHeader[2] === 0x67 && fileHeader[3] === 0x53;
        return false;
      });

      // If header validation fails, still allow the file if MIME type is valid or if it's a valid audio extension
      if (!isValidAudioHeader) {
        const hasValidMimeType = audioFile.type && ALLOWED_AUDIO_TYPES.includes(audioFile.type);
        const hasValidExtension = config.allowedExtensions.includes(fileExtension);
        
        if (!hasValidMimeType && !hasValidExtension) {
          return NextResponse.json(
            { error: "Invalid audio file format" }, 
            { status: 400 }
          );
        }
      }
    }

    try {
      // Upload file to Supabase Storage
      const storageFile = await uploadFileToStorage(audioFile, fileName);

      // Create database record (no expiration)
      const record = await createAudioRecord({
        file_name: fileName,
        original_name: sanitizedName,
        file_size: audioFile.size,
        mime_type: audioFile.type,
        storage_path: storageFile.path,
        is_active: true
      });

      // Generate secure URL
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                     req.headers.get("origin") || 
                     "http://localhost:3000";
      const url = `${baseUrl}/share/${uniqueId}`;

      return NextResponse.json({ 
        url, 
        id: uniqueId,
        documentId: record.id,
        storageFileId: storageFile.path
      });

    } catch (supabaseError) {
      console.error("Supabase error:", supabaseError);
      return NextResponse.json(
        { error: "Failed to upload file to storage" }, 
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Server error: Failed to process upload" }, 
      { status: 500 }
    );
  }
}