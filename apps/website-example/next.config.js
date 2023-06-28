//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const {composePlugins, withNx} = require('@nx/next')

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    svgr: true
  },
  publicRuntimeConfig: {
    env: {
      API_URL: process.env.API_URL || ''
    }
  },
  compiler: {
    // This is needed so that we can use components as selectors in Emotion
    emotion: {
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
  transpilePackages: ['@wepublish/ui', '@wepublish/website']
}

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx
]

module.exports = composePlugins(...plugins)(nextConfig)
