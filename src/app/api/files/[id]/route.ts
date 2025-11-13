import { NextRequest, NextResponse } from 'next/server';
import {
  getFile,
  updateFile,
  moveFileToTrash,
  permanentlyDeleteFile,
} from '@/lib/storage/file-service';

/**
 * GET /api/files/[id]
 * Get file metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    const file = await getFile({
      fileId: params.id,
      userId,
    });

    return NextResponse.json({
      success: true,
      file: {
        id: file.id,
        name: file.name,
        originalName: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        folderId: file.folderId,
        description: file.description,
        tags: file.tags,
        isPublic: file.isPublic,
        isTrashed: file.isTrashed,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Get file error:', error);
    return NextResponse.json(
      { error: 'Failed to get file', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/files/[id]
 * Update file metadata
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId, name, description, folderId, isPublic } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    const updatedFile = await updateFile({
      fileId: params.id,
      userId,
      name,
      description,
      folderId,
      isPublic,
    });

    return NextResponse.json({
      success: true,
      file: {
        id: updatedFile.id,
        name: updatedFile.name,
        description: updatedFile.description,
        folderId: updatedFile.folderId,
        isPublic: updatedFile.isPublic,
        updatedAt: updatedFile.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Update file error:', error);
    return NextResponse.json(
      { error: 'Failed to update file', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/files/[id]
 * Move file to trash or permanently delete
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const permanent = searchParams.get('permanent') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    if (permanent) {
      await permanentlyDeleteFile({
        fileId: params.id,
        userId,
      });

      return NextResponse.json({
        success: true,
        message: 'File permanently deleted',
      });
    } else {
      await moveFileToTrash({
        fileId: params.id,
        userId,
      });

      return NextResponse.json({
        success: true,
        message: 'File moved to trash',
      });
    }
  } catch (error: any) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { error: 'Failed to delete file', details: error.message },
      { status: 500 }
    );
  }
}
