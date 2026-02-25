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
