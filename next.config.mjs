/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // GitHub Pages uses a subdirectory based on your repo name
  // Uncomment and update this with your actual repository name
  basePath: '//AlphaLoader',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Ensure trailing slashes for GitHub Pages compatibility
  trailingSlash: true,
  // Add assetPrefix for GitHub Pages
  assetPrefix: '//AlphaLoader',
};

export default nextConfig;
