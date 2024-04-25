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
      API_URL: process.env.API_URL || ''
    }
  },
  // Adds the language attribute to the HTML
  i18n: {
    locales: ['gsw-CH'],
    defaultLocale: 'gsw-CH'
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
  // Not needed for the monorepository but for demo purposes.
  // @wepublish/ui and @wepublish/website are ES Modules which Next does not support yet.
  // This will transpile the ES Modules to CommonJS
  transpilePackages: ['@wepublish/ui', '@wepublish/website', 'react-tweet'],
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
  }
}

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
  withBundleAnalyzer
]

module.exports = composePlugins(...plugins)(nextConfig)
