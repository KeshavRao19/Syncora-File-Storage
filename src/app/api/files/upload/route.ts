import { NextRequest, NextResponse } from 'next/server';
import { createFile } from '@/lib/storage/file-service';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for file uploads

/**
 * POST /api/files/upload
 * Upload a new file to R2 storage
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication middleware to get userId
    // For now, we'll expect it in the request
    const formData = await request.formData();

    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const folderId = formData.get('folderId') as string | undefined;
    const isPublic = formData.get('isPublic') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create file in storage and database
    const newFile = await createFile({
      userId,
      name: file.name,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      fileBuffer: buffer,
      folderId,
      isPublic,
    });

    return NextResponse.json(
      {
        success: true,
        file: {
          id: newFile.id,
          name: newFile.name,
          size: newFile.size,
          mimeType: newFile.mimeType,
          createdAt: newFile.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Upload error:', error);

    if (error.message === 'Storage quota exceeded') {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }

    return NextResponse.json(
      { error: 'Failed to upload file', details: error.message },
      { status: 500 }
    );
  }
}
