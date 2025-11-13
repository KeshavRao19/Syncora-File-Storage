'use client';

import { useState, useEffect } from 'react';
import { formatFileSize, getFileIcon } from '@/lib/utils/file-utils';

interface File {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  folderId: string | null;
  isPublic: boolean;
  isTrashed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FileBrowserProps {
  userId: string;
  folderId?: string | null;
  onRefresh?: number; // Trigger to refresh files
}

export function FileBrowser({ userId, folderId, onRefresh }: FileBrowserProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFiles();
  }, [userId, folderId, onRefresh]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ userId });
      if (folderId !== undefined) {
        params.append('folderId', folderId === null ? 'null' : folderId);
      }

      const response = await fetch(`/api/files?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }

      const data = await response.json();
      setFiles(data.files);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/download?userId=${userId}`);

      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }

      const data = await response.json();

      // Open download URL in new tab
      window.open(data.downloadUrl, '_blank');
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Move this file to trash?')) {
      return;
    }

    try {
      const response = await fetch(`/api/files/${fileId}?userId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      // Refresh files
      fetchFiles();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error: {error}</p>
        <button
          onClick={fetchFiles}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📂</div>
        <p className="text-gray-500">No files yet</p>
        <p className="text-sm text-gray-400 mt-2">Upload files to get started</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">
          {files.length} {files.length === 1 ? 'file' : 'files'}
        </h2>

        <button
          onClick={fetchFiles}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* File List - Grid View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {files.map((file) => (
          <div
            key={file.id}
            className={`
              border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer
              ${selectedFiles.has(file.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
            `}
            onClick={() => toggleFileSelection(file.id)}
          >
            <div className="flex items-start gap-3">
              <div className="text-4xl">{getFileIcon(file.mimeType)}</div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-gray-900 truncate" title={file.name}>
                  {file.name}
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  {formatFileSize(file.size)}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  {formatDate(file.createdAt)}
                </p>

                {file.isPublic && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                    Public
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(file.id, file.name);
                }}
                className="flex-1 px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Download
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(file.id);
                }}
                className="px-3 py-1.5 text-xs bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Table View Alternative (commented out) */}
      {/*
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modified</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {files.map((file) => (
              <tr key={file.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="mr-2">{getFileIcon(file.mimeType)}</span>
                    <span className="text-sm text-gray-900">{file.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatFileSize(file.size)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(file.updatedAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button onClick={() => handleDownload(file.id, file.name)} className="text-blue-600 hover:text-blue-900 mr-3">
                    Download
                  </button>
                  <button onClick={() => handleDelete(file.id)} className="text-red-600 hover:text-red-900">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      */}
    </div>
  );
}
