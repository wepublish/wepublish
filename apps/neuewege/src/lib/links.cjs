// Legacy paths that moved: shared by next.config.js (server redirects) and
// lib/links.js (menu links and link rewriting in CMS HTML).
//
// /mitmachen was the subscribe page of abos.neuewege.ch; the subscribe form
// now lives on /abos (the we.publish page `abos`).
const REDIRECTS = {
  '/mitmachen': '/abos',
};

const redirects = Object.entries(REDIRECTS).map(([source, destination]) => ({
  source,
  destination,
  permanent: false,
}));

module.exports = { REDIRECTS, redirects };
