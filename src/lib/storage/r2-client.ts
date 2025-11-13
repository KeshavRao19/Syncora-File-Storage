import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Validate environment variables
if (!process.env.CLOUDFLARE_ENDPOINT) {
  throw new Error('CLOUDFLARE_ENDPOINT is not defined');
}
if (!process.env.CLOUDFLARE_ACCESS_KEY_ID) {
  throw new Error('CLOUDFLARE_ACCESS_KEY_ID is not defined');
}
if (!process.env.CLOUDFLARE_SECRET_ACCESS_KEY) {
  throw new Error('CLOUDFLARE_SECRET_ACCESS_KEY is not defined');
}
if (!process.env.R2_BUCKET_NAME) {
  throw new Error('R2_BUCKET_NAME is not defined');
}

// Initialize R2 client (Cloudflare R2 uses S3-compatible API)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

export interface UploadFileParams {
  key: string;
  body: Buffer | Uint8Array | Blob | string;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface DownloadFileParams {
  key: string;
}

export interface DeleteFileParams {
  key: string;
}

export interface GetSignedUrlParams {
  key: string;
  expiresIn?: number; // in seconds, default 3600 (1 hour)
}

/**
 * Upload a file to Cloudflare R2
 */
export async function uploadFile(params: UploadFileParams): Promise<void> {
  const { key, body, contentType, metadata } = params;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
  });

  await r2Client.send(command);
}

/**
 * Get a presigned URL for downloading a file
 * This allows temporary access without exposing credentials
 */
export async function getDownloadUrl(params: GetSignedUrlParams): Promise<string> {
  const { key, expiresIn = 3600 } = params;

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Get a presigned URL for uploading a file directly from the client
 * Useful for large files to avoid passing through the server
 */
export async function getUploadUrl(params: GetSignedUrlParams): Promise<string> {
  const { key, expiresIn = 3600 } = params;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Delete a file from R2
 */
export async function deleteFile(params: DeleteFileParams): Promise<void> {
  const { key } = params;

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}

/**
 * Check if a file exists in R2
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
}

/**
 * List files in R2 with optional prefix
 */
export async function listFiles(prefix?: string): Promise<string[]> {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  });

  const response = await r2Client.send(command);
  return response.Contents?.map((item) => item.Key!).filter(Boolean) || [];
}

/**
 * Generate a unique storage key for a file
 */
export function generateStorageKey(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

  return `${userId}/${timestamp}-${randomString}-${sanitizedFileName}`;
}

export { r2Client };
