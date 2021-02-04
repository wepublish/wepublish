import path from 'path'
import webpack from 'webpack'

import {ModuleMapPlugin, AssetListPlugin} from '@karma.run/webpack'

export default (mode: string) =>
  //@ts-ignore
  ({
    entry: {
      client: './src/client/index.ts',
      worker: './src/worker/index.ts'
    },
    output: {
      filename: mode === 'production' ? '[name].[chunkhash].js' : '[name].js',
      path: path.resolve(__dirname, 'assets'),
      publicPath: mode === 'production' ? '/assets' : 'http://localhost:5001/'
    },
    resolve: {
      extensions: ['.mjs', '.ts', '.tsx', '.js'],
      alias: {
        'react-dom': '@hot-loader/react-dom'
      }
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-react',
              '@babel/preset-typescript',
              ['@babel/preset-env', {modules: false}]
            ],
            plugins: [
              '@babel/plugin-syntax-dynamic-import',
              '@babel/plugin-proposal-optional-chaining',
              '@babel/plugin-proposal-nullish-coalescing-operator',
              ...(mode === 'production' ? [] : ['react-hot-loader/babel'])
            ]
          }
        },
        {
          test: /\.mjs$/,
          include: /node_modules/,
          type: 'javascript/auto'
        }
      ]
    },
    devtool: mode === 'production' ? 'source-map' : 'cheap-module-source-map',
    plugins: [
      new ModuleMapPlugin({filename: './dist/moduleMap.json'}),
      new AssetListPlugin({filename: './dist/assetList.json'})
    ],
    devServer: {
      writeToDisk: true,
      public: 'http://localhost:5001/',
      publicPath: 'http://localhost:5001/',
      host: '0.0.0.0',
      port: 5001,
      headers: {'Access-Control-Allow-Origin': '*'}
    }
  } as webpack.Configuration)
