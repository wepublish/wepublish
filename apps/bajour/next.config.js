//@ts-check

const {composePlugins, withNx} = require('@nx/next')
const {join} = require('path')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.NODE_ENV === 'production',
  openAnalyzer: false
})

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    svgr: true
  },
  poweredByHeader: false,
  reactStrictMode: true,
  publicRuntimeConfig: {
    env: {
      API_URL: process.env.API_URL || '',
      STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY || '',
      GA_ID: process.env.GA_ID || ''
    }
  },
  i18n: {
    locales: ['gsw-CH'],
    defaultLocale: 'gsw-CH'
  },
  compiler: {
    emotion: {
      sourceMap: true,
      importMap: {
        '@mui/material': {
          styled: {
            canonicalImport: ['@emotion/styled', 'default'],
            styledBaseImport: ['@mui/material', 'styled']
          }
        },
        '@mui/material/styles': {
          styled: {
            canonicalImport: ['@emotion/styled', 'default'],
            styledBaseImport: ['@mui/material/styles', 'styled']
          }
        }
      }
    }
  },
  experimental: {
    scrollRestoration: true,
    outputFileTracingRoot: join(__dirname, '../../'),
    outputFileTracingExcludes: {
      '*': [
        '**/node_modules/@swc/core-linux-x64-musl',
        '**/node_modules/@swc/core-linux-x64-gnu ',
        '**/node_modules/@esbuild/linux-x64'
      ]
    }
  },
  transpilePackages: ['@wepublish/ui', '@wepublish/website', 'react-tweet'],
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: false
      },
      {
        source: '/a/:id((?!tag).*)/:slug',
        destination: '/a/:slug',
        permanent: false
      },
      {
        source: '/tag/:slug',
        destination: '/a/tag/:slug',
        permanent: false
      },
      {
        source: '/profile/dashboard',
        destination: '/login',
        permanent: false,
        has: [
          {
            type: 'query',
            key: 'jwt'
          }
        ]
      },
      {
        source: '/profile/dashboard',
        destination: '/profile',
        permanent: false
      },
      {
        source: '/member-uebersicht',
        destination: '/mitmachen',
        permanent: false
      },
      {
        source: '/goenner-uebersicht',
        destination: '/mitmachen',
        permanent: false
      },
      {
        source: '/spende',
        destination: '/mitmachen',
        permanent: false
      }
    ]
  }
}

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
  withBundleAnalyzer
]

module.exports = composePlugins(...plugins)(nextConfig)
