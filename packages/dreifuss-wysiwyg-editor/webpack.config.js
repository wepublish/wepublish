const config = {
  entry: {
    index: ['./src/index.ts']
  },
  output: {
    path: __dirname + '/lib',
    filename: '[name].js',
    libraryTarget: 'umd',
    library: 'DreifussWysiwygEditor'
  },
  resolve: {
    extensions: ['.mjs', '.ts', '.tsx', '.js', '.jsx']
  },
  externals: {
    react: {
      root: 'React',
      commonjs2: 'react',
      commonjs: 'react',
      amd: 'react'
    },
    'react-dom': {
      root: 'ReactDOM',
      commonjs: 'react-dom',
      commonjs2: 'react-dom',
      amd: 'react-dom'
    }
  },
  module: {
    rules: [
      {
        test: /.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ]
  }
}

module.exports = config
