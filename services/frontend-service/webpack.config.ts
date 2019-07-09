import path from 'path'
import webpack from 'webpack'

export const clientConfig: webpack.Configuration = {
  entry: {
    client: './src/client.ts'
  },
  output: {
    chunkFilename: 'client.[name].js',
    path: path.resolve(__dirname, './static'),
    publicPath: '/static/'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'babel-loader'
      }
    ]
  },
  devServer: {
    host: '0.0.0.0',
    port: 3001
  }
}

export default clientConfig
