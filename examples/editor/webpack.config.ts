import path from 'path'
import webpack from 'webpack'

import {ModuleMapPlugin, AssetListPlugin} from '@karma.run/webpack'

export default (mode: string) =>
  ({
    entry: {
      client: './src/client/index.ts'
    },
    output: {
      filename: mode === 'production' ? '[name].[chunkhash].js' : '[name].js',
      path: path.resolve(__dirname, 'static'),
      publicPath: mode === 'production' ? '/static' : 'http://localhost:8081/'
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
      public: 'http://localhost:8081/',
      publicPath: 'http://localhost:8081/',
      host: '0.0.0.0',
      port: 8081,
      headers: {'Access-Control-Allow-Origin': '*'}
    }
  } as webpack.Configuration)
