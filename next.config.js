// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['utfs.io']
  },
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ['@opentelemetry/instrumentation']
  }
};

module.exports = nextConfig;
