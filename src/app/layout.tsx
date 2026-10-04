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
    <html lang="en" className="dark">
      <body className="bg-neutral-950 text-neutral-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
