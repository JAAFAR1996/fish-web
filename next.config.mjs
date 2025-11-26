import path from 'path';
import { fileURLToPath } from 'url';
import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import withPWA from 'next-pwa';
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';
import withBundleAnalyzer from '@next/bundle-analyzer';

import { IMAGE_DEVICE_SIZES, IMAGE_SIZES } from './src/lib/config/ui.js';

const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'off',
  },
  {
    key: 'X-Permitted-Cross-Domain-Policies',
    value: 'none',
  },
];

function getAdditionalImageHosts() {
  const raw = process.env.NEXT_PUBLIC_IMAGE_HOSTS;
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);
}

function getR2Hostname() {
  const url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!url) {
    return null;
  }

  try {
    return new URL(url).hostname;
  } catch (error) {
    console.warn(
      `Invalid NEXT_PUBLIC_R2_PUBLIC_URL: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return null;
  }
}

function buildRuntimeCaching() {
  const caching = [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
      },
    },
  ];

  return caching;
}

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: 'wrap' }],
    ],
  },
});

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const r2Hostname = getR2Hostname();
const additionalHosts = getAdditionalImageHosts();
const runtimeCaching = buildRuntimeCaching();
const defaultRemoteImagePatterns = [
  {
    protocol: 'https',
    hostname: 'images.unsplash.com',
  },
];

const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable:
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_PWA_ENABLED === 'false',
  runtimeCaching,
};

const remoteImagePatterns = [
  ...defaultRemoteImagePatterns,
  ...(r2Hostname
    ? [
        {
          protocol: 'https',
          hostname: r2Hostname,
        },
      ]
    : []),
  ...additionalHosts.map((hostname) => ({
    protocol: 'https',
    hostname,
  })),
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.WS_NO_BUFFER_UTIL) {
  process.env.WS_NO_BUFFER_UTIL = '1';
}
if (!process.env.WS_NO_UTF_8_VALIDATE) {
  process.env.WS_NO_UTF_8_VALIDATE = '1';
}

const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: remoteImagePatterns,
    deviceSizes: [...IMAGE_DEVICE_SIZES],
    imageSizes: [...IMAGE_SIZES],
  },
  typedRoutes: true,
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react', 'fuse.js'],
    // Exclude local/dev artifacts from serverless bundles to keep function size small
    outputFileTracingExcludes: {
      '*': [
        '**/.next/cache/**',
        '**/.git/**',
        '**/.local/**',
        '**/tmp/**',
        '**/temp/**',
        '**/node_modules/.cache/**',
      ],
    },
  },
  webpack(config) {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['bufferutil'] = path.resolve(__dirname, 'bufferutil.cjs');
    config.resolve.alias['utf-8-validate'] = false;
    config.resolve.alias['@server'] = path.resolve(__dirname, 'server');
    config.resolve.alias['@shared'] = path.resolve(__dirname, 'shared');
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|gif|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const moduleExports = withAnalyzer(withPWA(pwaConfig)(withMDX(withNextIntl(nextConfig))));

const enableSentryUploads =
  Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT);

const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  dryRun: !enableSentryUploads,
};

const sentryOptions = {
  widenClientFileUpload: true,
  transpileClientSDK: true,
  hideSourceMaps: false,
  disableLogger: true,
};

export default withSentryConfig(moduleExports, sentryWebpackPluginOptions, sentryOptions);
