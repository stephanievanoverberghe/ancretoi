// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'i.ytimg.com' }, // YouTube thumbs
            { protocol: 'https', hostname: 'img.youtube.com' }, // autre alias possible
            {
                protocol: 'https',
                hostname: 'vumbnail.com',
            },
        ],
    },
};

export default nextConfig;
