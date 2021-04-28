const webpack = require('webpack')
const path = require('path')

const config = {
  entry: {
    DreifussWysiwygEditorDemo: [path.resolve(__dirname, './src/DreifussWysiwygEditorDemo.tsx')]
  },
  output: {
    path: path.resolve(__dirname, './demo'),
    filename: 'bundle.js'
  },
  resolve: {
    extensions: ['.mjs', '.ts', '.tsx', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false
        }
      }
    ]
  },
  devServer: {
    contentBase: './demo',
    historyApiFallback: true,
    open: true,
    hot: true
  },
  plugins: [new webpack.HotModuleReplacementPlugin()]
}

module.exports = config
