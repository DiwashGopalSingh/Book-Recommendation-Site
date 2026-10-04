import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Open Classics Community Library & Reading Portal',
  description: 'Free public-domain literature from Project Gutenberg & Open Library, curated reading shelves, and surveillance-free private reading tracker.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#FAF7F2] text-[#1C1917] antialiased selection:bg-teal-200 selection:text-teal-900">
        {children}
      </body>
    </html>
  );
}
