/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { unoptimized: true },
  
  // Keep this as is
  serverExternalPackages: ['pdfjs-dist'],

  turbopack: {
    resolveAlias: {
      // FIX: Use an empty string "" instead of false
      canvas: "",
      encoding: "",
    },
  },
};

module.exports = nextConfig;