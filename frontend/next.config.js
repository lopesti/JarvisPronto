/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    reactStrictMode: true,
    images: {
        domains: ['localhost'],
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://api:3000/api/:path*',
            },
            {
                source: '/auth/:path*',
                destination: 'http://api:3000/auth/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
