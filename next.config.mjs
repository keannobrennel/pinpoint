/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["firebase-admin"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/pinpoint-35320.firebasestorage.app/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/seed-bucket/**",
      },
    ],
  },
};

export default nextConfig;