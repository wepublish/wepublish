const {composePlugins, withNx} = require('@nrwl/webpack')
const {withReact} = require('@nrwl/react')
const {merge} = require('webpack-merge')

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), withReact(), (config, {options, context}) => {
  return merge(config, {
    resolve: {
      fallback: {
        assert: require.resolve('assert'),
        util: require.resolve('util'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        querystring: require.resolve('querystring-es3'),
        url: require.resolve('url'),
        buffer: require.resolve('buffer')
      }
    }
  })
})
