import webpack from 'webpack'
import path from 'path'

export default (env: any, {mode}: any) =>
  ({
    entry: {
      DreifussWysiwygEditorDemo: [path.resolve(__dirname, './src/DreifussWysiwygEditorDemo.tsx')]
    },
    output: {
      path: path.resolve(__dirname, './demo'),
      filename: 'bundle.js'
    },
    resolve: {
      extensions: ['.mjs', '.ts', '.tsx', '.js', '.jsx'],
      alias: {
        'react/jsx-runtime': require.resolve('jsx-runtime')
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
              [
                '@babel/preset-env',
                {
                  modules: false,
                  targets: [
                    'last 2 Chrome versions',
                    'last 2 Safari versions',
                    'last 2 Firefox versions'
                  ]
                }
              ]
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
    },
    devServer: {
      contentBase: './demo',
      historyApiFallback: true,
      open: true,
      hot: true
    },
    plugins: [new webpack.HotModuleReplacementPlugin()]
  } as webpack.Configuration)
