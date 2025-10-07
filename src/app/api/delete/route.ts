import { NextRequest, NextResponse } from "next/server";
import { 
  findAudioRecordByFileName,
  deleteAudioRecord,
  deleteFileFromStorage
} from "@/lib/supabase";
import { SecurityUtils } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    // Extract ID from URL
    const urlParts = url.split('/');
    const audioId = urlParts[urlParts.length - 1];

    // Validate ID format
    if (!SecurityUtils.validateId(audioId)) {
      return NextResponse.json({ error: "Invalid audio ID format" }, { status: 400 });
    }

    // Find the audio record
    const fileNamePattern = `${audioId}.%`;
    const audioFile = await findAudioRecordByFileName(fileNamePattern);

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file not found" }, { status: 404 });
    }

    // Delete from storage
    try {
      await deleteFileFromStorage(audioFile.storage_path);
    } catch (storageError) {
      console.error("Error deleting from storage:", storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    await deleteAudioRecord(audioFile.id);

    return NextResponse.json({ 
      success: true, 
      message: "Audio file deleted successfully" 
    });

  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete audio file" }, 
      { status: 500 }
    );
  }
}
