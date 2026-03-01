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

  // Keep @modelcontextprotocol/sdk as external so Node.js resolves its
  // nested dependencies (zod v4) correctly at runtime instead of webpack
  // bundling them against the project root's zod v3.
  const existingExternals = config.externals || [];
  const mcpExternal = ({ request }, callback) => {
    if (/^@modelcontextprotocol\/sdk/.test(request)) {
      return callback(null, 'commonjs ' + request);
    }
    callback();
  };
  config.externals =
    Array.isArray(existingExternals) ?
      [...existingExternals, mcpExternal]
    : [existingExternals, mcpExternal];

  return config;
});
