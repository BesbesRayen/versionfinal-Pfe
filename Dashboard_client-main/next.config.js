/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // required for Docker multi-stage build
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ui-avatars.com' },
    ],
  },
};

module.exports = nextConfig;
