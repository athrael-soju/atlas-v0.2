/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['utfs.io']
  },
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ['@opentelemetry/instrumentation']
  },
  webpack: (config, { isServer }) => {
    // Add support for .node files (binary)
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });

    // Optionally, exclude `snappy` from bundling if needed
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        snappy: 'commonjs snappy'
      });
    }

    return config;
  }
};

module.exports = nextConfig;
