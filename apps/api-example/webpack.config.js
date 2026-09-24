const { composePlugins, withNx } = require('@nx/webpack');

const swcDefaultConfig =
  require('@nestjs/cli/lib/compiler/defaults/swc-defaults').swcDefaultsFactory()
    .swcOptions;

module.exports = composePlugins(withNx(), config => {
  config.module.rules.push({
    test: /\.ts$/,
    exclude: /node_modules/,
    use: {
      loader: 'swc-loader',
      options: swcDefaultConfig,
    },
  });
  // The newsletter email renderer (`@wepublish/newsletter`) is React; the API
  // renders it to HTML server-side, so TSX has to compile here as well.
  config.module.rules.push({
    test: /\.tsx$/,
    exclude: /node_modules/,
    use: {
      loader: 'swc-loader',
      options: {
        ...swcDefaultConfig,
        jsc: {
          ...swcDefaultConfig.jsc,
          parser: { ...swcDefaultConfig.jsc.parser, tsx: true },
          transform: {
            ...swcDefaultConfig.jsc.transform,
            react: { runtime: 'automatic' },
          },
        },
      },
    },
  });
  return config;
});
