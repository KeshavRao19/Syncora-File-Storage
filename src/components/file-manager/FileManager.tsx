'use client';

import { useState } from 'react';
import { FileUpload } from './FileUpload';
import { FileBrowser } from './FileBrowser';

interface FileManagerProps {
  userId: string;
  folderId?: string | null;
}

export function FileManager({ userId, folderId }: FileManagerProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showUpload, setShowUpload] = useState(false);

  const handleUploadComplete = () => {
    // Trigger file list refresh
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Files</h1>
            <p className="text-gray-500 mt-1">Upload and manage your files</p>
          </div>

          <button
            onClick={() => setShowUpload(!showUpload)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {showUpload ? 'Hide Upload' : 'Upload Files'}
          </button>
        </div>

        {/* Upload Section */}
        {showUpload && (
          <div className="mb-8">
            <FileUpload
              userId={userId}
              folderId={folderId || undefined}
              onUploadComplete={handleUploadComplete}
            />
          </div>
        )}
      </div>

      {/* File Browser */}
      <FileBrowser userId={userId} folderId={folderId} onRefresh={refreshTrigger} />
    </div>
  );
}
