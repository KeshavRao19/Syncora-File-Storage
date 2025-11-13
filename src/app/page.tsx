import { FileManager } from '@/components/file-manager/FileManager';

export default function HomePage() {
  // TODO: Replace with actual authenticated user ID from session
  // For now, using a placeholder
  const userId = 'user-demo-123';

  return (
    <main className="min-h-screen bg-gray-50">
      <FileManager userId={userId} />
    </main>
  );
}
