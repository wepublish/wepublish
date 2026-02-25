const { withSentryConfig } = require('@sentry/nextjs');

module.exports = config => {
  const sentryConfig = withSentryConfig(config, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    silent: !process.env.CI,
    widenClientFileUpload: true,
    disableLogger: true,
    sourcemaps: {
      deleteSourcemapsAfterUpload: true,
    },
  });

  // @sentry/profiling-node has native bindings (child_process, fs, etc.).
  // Alias it to false in client builds so webpack doesn't try to bundle it.
  const originalWebpack = sentryConfig.webpack;
  sentryConfig.webpack = (webpackConfig, options) => {
    const result =
      originalWebpack ? originalWebpack(webpackConfig, options) : webpackConfig;

    if (!options.isServer) {
      result.resolve.alias['@sentry/profiling-node'] = false;
    }

    return result;
  };

  return sentryConfig;
};
