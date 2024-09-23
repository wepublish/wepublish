//@ts-check

const {composePlugins, withNx} = require('@nx/next')
const wepNextConfig = require('../../libs/utils/website/src/lib/next.config')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: !!process.env.ANALYZE_BUNDLE,
  openAnalyzer: false
})
const redirects = require('./redirects.json')

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  ...wepNextConfig,
  publicRuntimeConfig: {
    env: {
      API_URL: process.env.API_URL || '',
      GA_ID: process.env.GA_ID || ''
    }
  },
  async redirects() {
    return redirects
  }
}

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
  withBundleAnalyzer
]

module.exports = composePlugins(...plugins)(nextConfig)
