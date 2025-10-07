import { NextRequest, NextResponse } from "next/server";
import { deleteExpiredFiles, getFileStats } from "@/lib/supabase";

// File cleanup API endpoint
// This should be called periodically to clean up old files
export async function POST(req: NextRequest) {
  try {
    // Verify this is an internal request or has proper authorization
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.CLEANUP_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use Supabase cleanup function
    const result = await deleteExpiredFiles();
    
    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      totalSizeDeleted: result.totalSize,
      message: result.message
    });
    
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: "Internal server error during cleanup" }, 
      { status: 500 }
    );
  }
}

// GET endpoint to check file statistics
export async function GET(_req: NextRequest) {
  try {
    // Use Supabase stats function
    const stats = await getFileStats();
    
    return NextResponse.json(stats);
    
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

