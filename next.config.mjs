/** @type {import('next').NextConfig} */
import pwa from 'next-pwa';

const withPWA = pwa({
    dest: 'public'
});

const nextConfig = {
    // your next config options
};

export default withPWA(nextConfig);
