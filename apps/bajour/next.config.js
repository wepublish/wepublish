//@ts-check

const {composePlugins, withNx} = require('@nx/next')
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
  transpilePackages: ['@wepublish/ui', '@wepublish/website', 'react-tweet']
}

const plugins = [withNx, withBundleAnalyzer]

module.exports = composePlugins(...plugins)(nextConfig)
