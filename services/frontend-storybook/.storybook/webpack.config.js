module.exports = ({config}) => {
  config.module.rules.push({
    test: /\.tsx?$/,
    exclude: /node_modules/,
    loaders: ['babel-loader', 'react-docgen-typescript-loader']
  })

  config.resolve.extensions.push('.ts', '.tsx')
  return config
}
