//@ts-check

const wepNextConfig = require('../../../libs/utils/website/src/lib/next.config');

async function redirects() {
  return [
    ...((await wepNextConfig.redirects?.()) ?? []),
    // The renewal mail of October 2026 linked to /p/profile?jwt=…; the query
    // (and with it the login token) is passed on unchanged. Temporary (307), so
    // it can be dropped once those links no longer matter.
    { source: '/p/:path*', destination: '/:path*', permanent: false },
  ];
}

module.exports = { redirects };
