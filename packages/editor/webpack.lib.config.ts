/* eslint i18next/no-literal-string: [0] */
import path from 'path'
import webpack from 'webpack'

import {AssetListPlugin} from '@karma.run/webpack'
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import {CleanWebpackPlugin} from 'clean-webpack-plugin'

const port = process.env.ASSET_PORT || '3001'

export default (env: any, {mode}: any) =>
  ({
    entry: {
      client: './src/client/index.tsx'
    },
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, 'lib'),
      publicPath: mode === 'production' ? '/assets' : `http://localhost:${port}/`,
      libraryTarget: 'umd',
      library: 'editor-lib'
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      alias:
        mode === 'production'
          ? {}
          : {
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
              ['@babel/preset-env', {modules: false}],
              ['rsuite', {style: true, theme: 'default'}]
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
          test: /\.(css|less)$/i,
          use: [
            'style-loader',
            'css-loader',
            {
              loader: 'less-loader',
              options: {
                lessOptions: {
                  javascriptEnabled: true
                }
              }
            }
          ]
        }
      ]
    },
    devtool: mode === 'production' ? 'source-map' : 'cheap-module-source-map',
    plugins: [
      new webpack.DefinePlugin({NODE_ENV: JSON.stringify(process.env.NODE_ENV)}),
      new CleanWebpackPlugin({cleanStaleWebpackAssets: true}),
      new AssetListPlugin({filename: './dist/assetList.json'}),
      new ForkTsCheckerWebpackPlugin({
        tsconfig: './tsconfig.json'
      })
    ],
    devServer: {
      writeToDisk: true,
      public: `http://localhost:${port}/`,
      publicPath: `http://localhost:${port}/`,
      host: '0.0.0.0',
      port: parseInt(port),
      headers: {'Access-Control-Allow-Origin': '*'}
    }
  } as webpack.Configuration)
