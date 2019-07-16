import path from 'path'
import webpack from 'webpack'

import {ModuleMapPlugin, AssetListPlugin} from '@wepublish/webpack'

export default (mode: string) =>
  ({
    entry: {
      client: './src/client.ts'
    },
    output: {
      filename: mode === 'production' ? '[name].[chunkhash].js' : '[name].[hash].js',
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
      new ModuleMapPlugin({filename: 'moduleMap.json'}),
      new AssetListPlugin({filename: 'assetList.json'})
    ],
    devServer: {
      writeToDisk: true,
      public: 'http://localhost:3001',
      publicPath: 'http://localhost:3001/static/',
      host: '0.0.0.0',
      port: 3001,
      headers: {'Access-Control-Allow-Origin': '*'}
    }
  } as webpack.Configuration)
