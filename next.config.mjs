/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // 웹 페이지 버전 (public/web.html)을 /web 경로로 서빙
    return [{ source: "/web", destination: "/web.html" }];
  },
};

export default nextConfig;
