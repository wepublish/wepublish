import path from 'path'
import webpack from 'webpack'

import {AssetListPlugin} from '@karma.run/webpack'
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import {CleanWebpackPlugin} from 'clean-webpack-plugin'

export default (env: any, {mode}: any) =>
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
          test: /\.css$/i,
          use: ['style-loader', 'css-loader']
        },
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
              [
                'prismjs',
                {
                  languages: ['javascript', 'css', 'markup'],
                  plugins: ['line-numbers'],
                  theme: 'coy',
                  css: true
                }
              ],
              ...(mode === 'production' ? [] : ['react-hot-loader/babel'])
            ]
          }
        }
      ]
    },
    devtool: mode === 'production' ? 'source-map' : 'cheap-module-source-map',
    plugins: [
      new CleanWebpackPlugin({cleanStaleWebpackAssets: true}),
      new AssetListPlugin({filename: './dist/assetList.json'}),
      new ForkTsCheckerWebpackPlugin({
        tsconfig: './tsconfig.json'
      })
    ],
    devServer: {
      writeToDisk: true,
      public: 'http://localhost:3001/',
      publicPath: 'http://localhost:3001/',
      host: '0.0.0.0',
      port: 3001,
      headers: {'Access-Control-Allow-Origin': '*'}
    }
  } as webpack.Configuration)
