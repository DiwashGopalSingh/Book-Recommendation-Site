/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  serverExternalPackages: ['@electric-sql/pglite'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.21st.dev',
      },
      {
        protocol: 'https',
        hostname: 'covers.openlibrary.org',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'standardebooks.org',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'www.gutenberg.org',
      },
      {
        protocol: 'https',
        hostname: 'gutenberg.org',
      },
    ],
  },
};

export default nextConfig;
