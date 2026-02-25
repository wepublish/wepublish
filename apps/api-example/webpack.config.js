const { composePlugins, withNx } = require('@nx/webpack');

const swcDefaultConfig =
  require('@nestjs/cli/lib/compiler/defaults/swc-defaults').swcDefaultsFactory()
    .swcOptions;

function removeTsLoader(rules) {
  return rules.filter(rule => {
    if (typeof rule.loader === 'string' && rule.loader.includes('ts-loader'))
      return false;
    if (Array.isArray(rule.use)) {
      rule.use = rule.use.filter(use => {
        const loader = typeof use === 'string' ? use : use?.loader;
        return !(loader && loader.includes('ts-loader'));
      });
    }
    if (rule.oneOf) rule.oneOf = removeTsLoader(rule.oneOf);
    if (rule.rules) rule.rules = removeTsLoader(rule.rules);
    return true;
  });
}

module.exports = composePlugins(withNx(), config => {
  config.devtool = 'source-map';
  config.module.rules = removeTsLoader(config.module.rules);

  // Bundle @sentry packages instead of externalizing them.
  // pkg cannot resolve subpath exports like @sentry/nestjs/setup.
  if (Array.isArray(config.externals)) {
    config.externals = config.externals.map(external => {
      if (typeof external !== 'function') return external;
      return (ctx, callback) => {
        if (
          ctx.request &&
          ctx.request.startsWith('@sentry/') &&
          !ctx.request.startsWith('@sentry/profiling-node')
        ) {
          return callback();
        }
        return external(ctx, callback);
      };
    });
  }

  config.module.rules.push({
    test: /\.ts$/,
    exclude: /node_modules/,
    use: {
      loader: 'swc-loader',
      options: swcDefaultConfig,
    },
  });
  return config;
});
