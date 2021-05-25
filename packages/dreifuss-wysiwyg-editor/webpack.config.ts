import webpack from 'webpack'
import path from 'path'

export default (env: any, {mode}: any) =>
  ({
    entry: {
      index: ['./src/index.ts']
    },
    output: {
      path: path.resolve(__dirname, '/lib'),
      filename: '[name].js',
      libraryTarget: 'umd',
      library: 'DreifussWysiwygEditor'
    },
    resolve: {
      extensions: ['.mjs', '.ts', '.tsx', '.js', '.jsx']
    },
    externals: {
      react: {
        root: 'React',
        commonjs2: 'react',
        commonjs: 'react',
        amd: 'react'
      },
      'react-dom': {
        root: 'ReactDOM',
        commonjs: 'react-dom',
        commonjs2: 'react-dom',
        amd: 'react-dom'
      }
    },
    stats: {
      errorDetails: true
    },
    module: {
      rules: [
        {
          test: /\.m?js/,
          resolve: {
            fullySpecified: false
          }
        },
        {
          test: /.(ts|tsx|js|jsx)$/,
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
        {test: /\.css$/, use: ['style-loader', 'css-loader']}
      ]
    }
  } as webpack.Configuration)
