/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://campusops-backend-569825175242.us-east1.run.app/:path*',
      },
    ]
  },
};

export default nextConfig;
