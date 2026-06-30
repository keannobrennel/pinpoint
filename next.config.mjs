/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["firebase-admin"],
  allowedDevOrigins: ["192.168.196.2"],
};

export default nextConfig;
