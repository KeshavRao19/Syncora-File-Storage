import { db } from '@/db';
import { files, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  uploadFile,
  deleteFile,
  getDownloadUrl,
  generateStorageKey,
  fileExists,
} from './r2-client';
import { randomBytes } from 'crypto';

export interface CreateFileParams {
  userId: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  fileBuffer: Buffer;
  folderId?: string;
  isPublic?: boolean;
}

export interface UpdateFileParams {
  fileId: string;
  userId: string;
  name?: string;
  description?: string;
  folderId?: string;
  isPublic?: boolean;
}

export interface DeleteFileParams {
  fileId: string;
  userId: string;
}

export interface GetFileParams {
  fileId: string;
  userId: string;
}

/**
 * Create a new file: upload to R2 and save metadata to database
 */
export async function createFile(params: CreateFileParams) {
  const {
    userId,
    name,
    originalName,
    mimeType,
    size,
    fileBuffer,
    folderId,
    isPublic = false,
  } = params;

  // Check user's storage quota
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  if (!user) {
    throw new Error('User not found');
  }

  if (user.storageUsed + size > user.storageQuota) {
    throw new Error('Storage quota exceeded');
  }

  // Generate unique storage key
  const storageKey = generateStorageKey(userId, originalName);

  // Upload to R2
  await uploadFile({
    key: storageKey,
    body: fileBuffer,
    contentType: mimeType,
    metadata: {
      userId,
      originalName,
    },
  });

  // Generate share token if public
  const shareToken = isPublic ? randomBytes(32).toString('hex') : null;

  // Save to database
  const [newFile] = await db
    .insert(files)
    .values({
      name,
      originalName,
      mimeType,
      size,
      storageKey,
      userId,
      folderId: folderId || null,
      isPublic,
      shareToken,
    })
    .returning();

  // Update user's storage usage
  await db
    .update(users)
    .set({
      storageUsed: user.storageUsed + size,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return newFile;
}

/**
 * Get file metadata
 */
export async function getFile(params: GetFileParams) {
  const { fileId, userId } = params;

  const [file] = await db
    .select()
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, userId), eq(files.isTrashed, false)));

  if (!file) {
    throw new Error('File not found');
  }

  return file;
}

/**
 * Get download URL for a file
 */
export async function getFileDownloadUrl(fileId: string, userId: string): Promise<string> {
  const file = await getFile({ fileId, userId });

  // Generate presigned URL (valid for 1 hour)
  const downloadUrl = await getDownloadUrl({
    key: file.storageKey,
    expiresIn: 3600,
  });

  return downloadUrl;
}

/**
 * Get public file by share token
 */
export async function getPublicFile(shareToken: string) {
  const [file] = await db
    .select()
    .from(files)
    .where(
      and(
        eq(files.shareToken, shareToken),
        eq(files.isPublic, true),
        eq(files.isTrashed, false)
      )
    );

  if (!file) {
    throw new Error('File not found or not public');
  }

  return file;
}

/**
 * Update file metadata
 */
export async function updateFile(params: UpdateFileParams) {
  const { fileId, userId, ...updates } = params;

  const [updatedFile] = await db
    .update(files)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(and(eq(files.id, fileId), eq(files.userId, userId)))
    .returning();

  if (!updatedFile) {
    throw new Error('File not found');
  }

  return updatedFile;
}

/**
 * Move file to trash
 */
export async function moveFileToTrash(params: DeleteFileParams) {
  const { fileId, userId } = params;

  const [trashedFile] = await db
    .update(files)
    .set({
      isTrashed: true,
      trashedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(files.id, fileId), eq(files.userId, userId)))
    .returning();

  if (!trashedFile) {
    throw new Error('File not found');
  }

  return trashedFile;
}

/**
 * Permanently delete file from R2 and database
 */
export async function permanentlyDeleteFile(params: DeleteFileParams) {
  const { fileId, userId } = params;

  // Get file info
  const [file] = await db
    .select()
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, userId)));

  if (!file) {
    throw new Error('File not found');
  }

  // Delete from R2
  await deleteFile({ key: file.storageKey });

  // Delete from database
  await db.delete(files).where(eq(files.id, fileId));

  // Update user's storage usage
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  if (user) {
    await db
      .update(users)
      .set({
        storageUsed: Math.max(0, user.storageUsed - file.size),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  return file;
}

/**
 * List user's files
 */
export async function listUserFiles(
  userId: string,
  options?: {
    folderId?: string | null;
    includeTrash?: boolean;
  }
) {
  const conditions = [eq(files.userId, userId)];

  if (!options?.includeTrash) {
    conditions.push(eq(files.isTrashed, false));
  }

  if (options?.folderId !== undefined) {
    if (options.folderId === null) {
      conditions.push(eq(files.folderId, null));
    } else {
      conditions.push(eq(files.folderId, options.folderId));
    }
  }

  return await db.select().from(files).where(and(...conditions));
}
