/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Add your cloud storage / CDN hostname here once file storage is configured,
      // e.g. { protocol: "https", hostname: "your-bucket.s3.amazonaws.com" }
    ],
  },
};

module.exports = nextConfig;
