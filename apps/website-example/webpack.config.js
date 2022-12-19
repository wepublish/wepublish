const {merge} = require('webpack-merge')

module.exports = (config, context) => {
  return merge(config, {
    resolve: {
      fallback: {
        assert: require.resolve('assert'),
        util: require.resolve('util'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        querystring: require.resolve('querystring-es3'),
        url: require.resolve('url')
      }
    }
  })
}
