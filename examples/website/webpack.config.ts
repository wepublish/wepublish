import path from 'path'
import webpack from 'webpack'

import {ModuleMapPlugin, AssetListPlugin} from '@karma.run/webpack'

export default (mode: string) =>
  ({
    entry: {
      client: './src/client/index.ts',
      worker: './src/worker/index.ts'
    },
    output: {
      filename: mode === 'production' ? '[name].[chunkhash].js' : '[name].js',
      path: path.resolve(__dirname, 'static'),
      publicPath: mode === 'production' ? '/static' : 'http://localhost:3003/'
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
      new ModuleMapPlugin({filename: './dist/moduleMap.json'}),
      new AssetListPlugin({filename: './dist/assetList.json'})
    ],
    devServer: {
      writeToDisk: true,
      public: 'http://localhost:3003/',
      publicPath: 'http://localhost:3003/',
      host: '0.0.0.0',
      port: 3003,
      headers: {'Access-Control-Allow-Origin': '*'}
    }
  } as webpack.Configuration)
