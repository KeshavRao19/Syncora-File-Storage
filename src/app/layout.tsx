import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Syncora - Secure File Storage',
  description: 'Upload, manage, and share your files securely',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
