/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,     // → /level/index.html, works on any static host          // fully static → works offline as a PWA, host anywhere
  images: { unoptimized: true },
  reactStrictMode: true,
};
export default nextConfig;
