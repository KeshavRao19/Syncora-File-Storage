'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { useFileUpload } from '@/hooks/use-file-upload';
import { formatFileSize, getFileIcon } from '@/lib/utils/file-utils';

interface FileUploadProps {
  userId: string;
  folderId?: string;
  onUploadComplete?: () => void;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
}

export function FileUpload({
  userId,
  folderId,
  onUploadComplete,
  maxFileSize = 100 * 1024 * 1024, // 100MB default
  allowedTypes,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploads, isUploading, uploadMultiple, clearUploads } = useFileUpload({
    userId,
    folderId,
    onSuccess: () => {
      onUploadComplete?.();
    },
  });

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  };

  const handleFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    // Validate files
    const validFiles = files.filter((file) => {
      if (file.size > maxFileSize) {
        alert(`${file.name} is too large. Max size is ${formatFileSize(maxFileSize)}`);
        return false;
      }

      if (allowedTypes && !allowedTypes.some((type) => file.type.match(type))) {
        alert(`${file.name} is not an allowed file type`);
        return false;
      }

      return true;
    });

    if (validFiles.length > 0) {
      await uploadMultiple(validFiles);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const uploadList = Object.values(uploads);

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={!isUploading ? handleButtonClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          accept={allowedTypes?.join(',')}
          disabled={isUploading}
        />

        <div className="flex flex-col items-center gap-4">
          <div className="text-6xl">📁</div>

          <div>
            <p className="text-lg font-semibold text-gray-700">
              {isDragging ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to browse
            </p>
          </div>

          <div className="text-xs text-gray-400">
            Max file size: {formatFileSize(maxFileSize)}
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadList.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold">Uploads</h3>
            <button
              onClick={clearUploads}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>

          {uploadList.map((upload, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="text-2xl">{getFileIcon('application/octet-stream')}</div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {upload.fileName}
                </p>

                {upload.status === 'uploading' && (
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}

                {upload.status === 'success' && (
                  <p className="text-xs text-green-600 mt-1">✓ Uploaded</p>
                )}

                {upload.status === 'error' && (
                  <p className="text-xs text-red-600 mt-1">
                    ✗ {upload.error || 'Upload failed'}
                  </p>
                )}
              </div>

              <div className="text-xs text-gray-500">
                {upload.status === 'uploading' && `${upload.progress}%`}
                {upload.status === 'success' && '✓'}
                {upload.status === 'error' && '✗'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
