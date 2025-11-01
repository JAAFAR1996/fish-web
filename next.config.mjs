import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import withPWA from 'next-pwa';

import { IMAGE_DEVICE_SIZES, IMAGE_SIZES } from './src/lib/config/ui.js';

const baseSecurityHeaders = [
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
];

function buildSecurityHeaders() {
  const headers = [...baseSecurityHeaders];
  const runtimeEnv =
    process.env.NEXT_PUBLIC_ENVIRONMENT ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV;
  const isPreview = runtimeEnv === 'staging' || runtimeEnv === 'preview';
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const useReportOnly = isPreview || isDevelopment;
  const cspHeaderKey = useReportOnly
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';

  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://plausible.io 'nonce-<generated>'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co https://plausible.io",
    "font-src 'self' https://fonts.gstatic.com",
    "frame-ancestors 'self'",
  ].join('; ');

  headers.push({
    key: cspHeaderKey,
    value: cspDirectives,
  });

  return headers;
}

function getSupabaseHostname() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'NEXT_PUBLIC_SUPABASE_URL is not set; Supabase image remote pattern will be disabled in development.'
      );
      return null;
    }
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required for image hosting configuration');
  }

  try {
    return new URL(url).hostname;
  } catch (error) {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

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

function createSupabasePattern(hostname, path) {
  const escapedHost = hostname.replace(/\./g, '\\.');
  return new RegExp(`^https://${escapedHost}${path}`, 'i');
}

function buildRuntimeCaching(supabaseHostname) {
  const caching = [
    ...(supabaseHostname
      ? [
          {
            urlPattern: createSupabasePattern(
              supabaseHostname,
              '/storage/v1/object/public/.*'
            ),
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-images',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: createSupabasePattern(supabaseHostname, '/rest/v1/.*'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-rest',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60,
              },
            },
          },
        ]
      : []),
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

  if (!supabaseHostname) {
    console.warn('Supabase hostname not configured; skipping Supabase runtime caching.');
  }

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

const supabaseHostname = getSupabaseHostname();
const additionalHosts = getAdditionalImageHosts();
const runtimeCaching = buildRuntimeCaching(supabaseHostname);

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
  ...(supabaseHostname
    ? [
        {
          protocol: 'https',
          hostname: supabaseHostname,
        },
      ]
    : []),
  ...additionalHosts.map((hostname) => ({
    protocol: 'https',
    hostname,
  })),
];

const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: remoteImagePatterns,
    deviceSizes: [...IMAGE_DEVICE_SIZES],
    imageSizes: [...IMAGE_SIZES],
  },
  experimental: {
    typedRoutes: true,
    optimizePackageImports: ['recharts', 'lucide-react', 'fuse.js'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: buildSecurityHeaders(),
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

export default withPWA(pwaConfig)(withMDX(nextConfig));
