import path from 'path'
import webpack from 'webpack'

import {AssetListPlugin} from '@karma.run/webpack'

export default (mode: string) =>
  ({
    entry: {
      client: './src/client/index.tsx'
    },
    output: {
      filename: mode === 'production' ? '[name].[chunkhash].js' : '[name].js',
      path: path.resolve(__dirname, 'assets'),
      publicPath: mode === 'production' ? '/assets' : 'http://localhost:3001/'
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
    devtool: mode === 'production' ? 'source-map' : 'cheap-module-source-map',
    plugins: [new AssetListPlugin({filename: './dist/assetList.json'})],
    devServer: {
      writeToDisk: true,
      public: 'http://localhost:3001/',
      publicPath: 'http://localhost:3001/',
      host: '0.0.0.0',
      port: 3001,
      headers: {'Access-Control-Allow-Origin': '*'}
    }
  } as webpack.Configuration)
