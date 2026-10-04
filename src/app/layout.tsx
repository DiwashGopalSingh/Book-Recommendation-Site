import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Open Library - Login & Book Showcase',
  description: 'Interactive animated login with open access public domain books in orbit',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-neutral-950 font-sans text-neutral-100 antialiased selection:bg-teal-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
