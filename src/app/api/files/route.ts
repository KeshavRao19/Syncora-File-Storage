import { NextRequest, NextResponse } from 'next/server';
import { listUserFiles } from '@/lib/storage/file-service';

/**
 * GET /api/files
 * List all files for a user
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Get userId from authentication session
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const folderId = searchParams.get('folderId');
    const includeTrash = searchParams.get('includeTrash') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    const files = await listUserFiles(userId, {
      folderId: folderId === 'null' ? null : folderId || undefined,
      includeTrash,
    });

    return NextResponse.json({
      success: true,
      files: files.map((file) => ({
        id: file.id,
        name: file.name,
        size: file.size,
        mimeType: file.mimeType,
        folderId: file.folderId,
        isPublic: file.isPublic,
        isTrashed: file.isTrashed,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error('List files error:', error);
    return NextResponse.json(
      { error: 'Failed to list files', details: error.message },
      { status: 500 }
    );
  }
}
