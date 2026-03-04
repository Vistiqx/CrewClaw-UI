// src/app/api/archive/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getArchives,
  permanentlyDeleteArchive,
  restoreArchive,
  cleanupExpiredArchives,
  getArchiveStats,
} from "@/lib/archive";

// GET /api/archive - Get all archives
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessPrefix = searchParams.get("businessPrefix") || undefined;
    const includeDeleted = searchParams.get("includeDeleted") === "true";
    const expiredOnly = searchParams.get("expiredOnly") === "true";
    const stats = searchParams.get("stats") === "true";

    if (stats) {
      const archiveStats = getArchiveStats();
      return NextResponse.json(archiveStats);
    }

    const archives = getArchives({
      businessPrefix,
      includeDeleted,
      expiredOnly,
    });

    return NextResponse.json(archives);
  } catch (error) {
    console.error("Error fetching archives:", error);
    return NextResponse.json(
      { error: "Failed to fetch archives" },
      { status: 500 }
    );
  }
}

// DELETE /api/archive?id=X - Permanently delete archive
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");

    if (!id) {
      return NextResponse.json(
        { error: "Archive ID is required" },
        { status: 400 }
      );
    }

    if (permanentlyDeleteArchive(id)) {
      return NextResponse.json({
        success: true,
        message: "Archive permanently deleted",
      });
    } else {
      return NextResponse.json(
        { error: "Archive not found or already deleted" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error deleting archive:", error);
    return NextResponse.json(
      { error: "Failed to delete archive" },
      { status: 500 }
    );
  }
}

// POST /api/archive/restore - Restore archive
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Archive ID is required" },
        { status: 400 }
      );
    }

    if (restoreArchive(id)) {
      return NextResponse.json({
        success: true,
        message: "Archive restored successfully",
      });
    } else {
      return NextResponse.json(
        { error: "Archive not found or path already exists" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error restoring archive:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to restore archive" },
      { status: 500 }
    );
  }
}
