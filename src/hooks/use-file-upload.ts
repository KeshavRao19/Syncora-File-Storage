import { useState } from 'react';

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface UseFileUploadOptions {
  userId: string;
  folderId?: string;
  onSuccess?: (file: any) => void;
  onError?: (error: Error) => void;
}

export function useFileUpload(options: UseFileUploadOptions) {
  const [uploads, setUploads] = useState<Record<string, UploadProgress>>({});
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File) => {
    const uploadId = `${file.name}-${Date.now()}`;

    // Initialize upload progress
    setUploads((prev) => ({
      ...prev,
      [uploadId]: {
        fileName: file.name,
        progress: 0,
        status: 'uploading',
      },
    }));

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', options.userId);

      if (options.folderId) {
        formData.append('folderId', options.folderId);
      }

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();

      // Update progress to success
      setUploads((prev) => ({
        ...prev,
        [uploadId]: {
          fileName: file.name,
          progress: 100,
          status: 'success',
        },
      }));

      options.onSuccess?.(data.file);

      return data.file;
    } catch (error: any) {
      // Update progress to error
      setUploads((prev) => ({
        ...prev,
        [uploadId]: {
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: error.message,
        },
      }));

      options.onError?.(error);

      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadMultiple = async (files: File[]) => {
    setIsUploading(true);

    try {
      const results = await Promise.allSettled(files.map((file) => uploadFile(file)));

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      return { successful, failed };
    } finally {
      setIsUploading(false);
    }
  };

  const clearUploads = () => {
    setUploads({});
  };

  return {
    uploads,
    isUploading,
    uploadFile,
    uploadMultiple,
    clearUploads,
  };
}
