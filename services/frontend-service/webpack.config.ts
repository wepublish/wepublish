import path from 'path'
import webpack from 'webpack'

import {ModuleMapPlugin} from '@wepublish/webpack'

export const clientConfig: webpack.Configuration = {
  entry: {
    client: './src/client.ts'
  },
  output: {
    chunkFilename: 'client.[name].js',
    path: path.resolve(__dirname, './static'),
    publicPath: 'http://localhost:3001/static/'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      'react-dom': '@hot-loader/react-dom'
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ]
  },
  plugins: [
    new ModuleMapPlugin({outputPath: path.resolve(__dirname, './dist/clientModuleMap.json')})
  ],
  devServer: {
    public: 'http://localhost:3001',
    publicPath: 'http://localhost:3001/static/',
    host: '0.0.0.0',
    port: 3001,
    headers: {'Access-Control-Allow-Origin': '*'}
  }
}

export default clientConfig
