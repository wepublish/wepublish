//@ts-check

const {join} = require('path')

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  output: 'standalone',
  nx: {
    svgr: true
  },
  poweredByHeader: false,
  reactStrictMode: true,
  // Adds the language attribute to the HTML
  i18n: {
    locales: ['de'],
    defaultLocale: 'de'
  },
  compiler: {
    // This is needed so that we can use components as selectors in Emotion
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
  async headers() {
    return [
      {
        // Apply these headers to all routes except /profile/*
        source: '/((?!profile).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=59, stale-while-revalidate=59, maxage=59, public'
          }
        ]
      },
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=59, stale-while-revalidate=59, maxage=59, public'
          }
        ]
      }
    ]
  },
  experimental: {
    scrollRestoration: true,
    outputFileTracingRoot: join(__dirname, '../../../../../'),
    outputFileTracingExcludes: {
      '*': [
        '**/node_modules/@swc/core-linux-x64-musl',
        '**/node_modules/@swc/core-linux-x64-gnu ',
        '**/node_modules/@esbuild/linux-x64',
        '**/node_modules/webpack',
        '**/node_modules/sass',
        '**/node_modules/terser',
        '**/node_modules/uglify-js'
      ]
    }
  },
  // Not needed for the monorepository but for demo purposes.
  // @wepublish/ui and @wepublish/website are ES Modules which Next does not support yet.
  // This will transpile the ES Modules to CommonJS
  transpilePackages: ['@wepublish/ui', '@wepublish/website', 'react-tweet']
}

module.exports = nextConfig
