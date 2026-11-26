export type LegacyRedirect = { destination: string; permanent: boolean };

const WIKI = 'https://wiki.reflekt.ch/';

const articleSlugs = [
  'angst-am-lehrstuhl',
  'antepay',
  'antepay-prozess',
  'antepay_kamp',
  'asylatlas',
  'ausbeutung-mit-aussicht',
  'aussageverweigerung',
  'berater',
  'berater_kamp',
  'boyun',
  'cities-for-sale',
  'coaching',
  'credit-crisis',
  'das-schattenregister',
  'datenbank-der-datenbanken',
  'datenfestung',
  'der-gluecksspielkoenig-vom-bodensee',
  'eritrea',
  'eritrea-yonas',
  'eritrea_yonas',
  'europas-neue-grossgrundbesitzer',
  'gift',
  'globalunion',
  'haft',
  'hatespeech',
  'hatespeech_kamp',
  'im-stich-gelassen',
  'interview-odermatt',
  'interview_odermatt',
  'jacobs',
  'malta',
  'palumbo',
  'pokerchef',
  'sammelwut',
  'sewn-on-the-edge',
  'sewn-on-the-edge-bangla',
  'so-in-transparent-sind-die-immobilien-unternehmen',
  'sumatra',
  'swisslife',
  'syngenta',
  'taliban',
  'tonnage',
  'uni',
  'uni-eng',
  'unifr',
  'welchen-firmen-gehoert-zuerich',
  'wem-gehoert-basel',
  'windkraft',
  'wohnen-am-limit',
  'wohnenamlimit',
  'zuerichaufdecken',
];

const articleAliases: Record<string, string> = { asy: 'asylatlas' };

const permanent = (destination: string): LegacyRedirect => ({
  destination,
  permanent: true,
});

const articleRedirects = (from: string, slug: string) => [
  [`/recherchen/${from}`, permanent(`/a/${slug}`)],
  [`/${from}`, permanent(`/a/${slug}`)],
];

const table: Record<string, LegacyRedirect> = {
  '/recherchen/wikipolitik': permanent(WIKI),
  '/wikipolitik': permanent(WIKI),
  '/a/wikipolitik': permanent(WIKI),
  ...Object.fromEntries(
    articleSlugs.flatMap(slug => articleRedirects(slug, slug))
  ),
  ...Object.fromEntries(
    Object.entries(articleAliases).flatMap(([from, slug]) =>
      articleRedirects(from, slug)
    )
  ),
  '/recherchen': permanent('/a/tag/recherchen'),
  '/news': permanent('/a/tag/news'),
  '/jetzt-lesen': permanent('/a/tag/recherchen'),
  '/mein-konto': permanent('/login'),
  '/kasse': permanent('/login'),
  '/spenden-3': permanent('/mitmachen'),
  '/spenden': permanent('/mitmachen'),
  '/jetzt-mitmachen': permanent('/mitmachen'),
  '/reflekt-im-gespraech': permanent('/a/reflekt-im-gespraech'),
  '/willkommen-guelsha': permanent('/a/willkommen-guelsha'),
  '/zuercher-journalistenpreis-fuer-mocambique-recherche': permanent(
    '/a/zuercher-journalistenpreis-fuer-mocambique-recherche'
  ),
  '/zuercher-unternehmer-war-pokerchef-der-gluecksspielmafia': permanent(
    '/a/zuercher-unternehmer-war-pokerchef-der-gluecksspielmafia'
  ),
  '/profile/subscription': permanent('/profile'),
  '/crowdfunding': { destination: '/mitmachen', permanent: false },
};

export const resolveLegacyRedirect = (
  pathname: string
): LegacyRedirect | null => {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  if (path.startsWith('/kasse/')) {
    return table['/kasse'];
  }

  return table[path] ?? null;
};
