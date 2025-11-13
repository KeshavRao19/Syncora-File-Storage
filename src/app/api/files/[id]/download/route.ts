import { NextRequest, NextResponse } from 'next/server';
import { getFileDownloadUrl } from '@/lib/storage/file-service';

/**
 * GET /api/files/[id]/download
 * Generate a presigned download URL
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

    const downloadUrl = await getFileDownloadUrl(params.id, userId);

    return NextResponse.json({
      success: true,
      downloadUrl,
    });
  } catch (error: any) {
    console.error('Download URL error:', error);
    return NextResponse.json(
      { error: 'Failed to generate download URL', details: error.message },
      { status: 500 }
    );
  }
}
