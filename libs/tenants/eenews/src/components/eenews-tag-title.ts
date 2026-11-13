import { FullTagFragment } from '@wepublish/website/api';

import {
  capitalizeTag,
  isAllowedTagName,
} from './teasers/eenews-teaser-selectors';

const SITE = 'ee-news';

/** `<title>` of `/a/tag`, the overview of all dossiers. */
export const EENEWS_DOSSIER_INDEX_TITLE = `${SITE} - Alle Dossiers`;

/**
 * `<title>` of a tag page. Mirrors how `EenewsTagPage` classifies a tag: a
 * main tag is a topic, a whitelisted one a dossier, anything else just a tag.
 */
export const eenewsTagTitle = (tag: Pick<FullTagFragment, 'tag' | 'main'>) => {
  const label = `«${capitalizeTag(tag.tag)}»`;

  if (tag.main) {
    return `${SITE} - Thema ${label}`;
  }

  if (isAllowedTagName(tag.tag)) {
    return `${SITE} - Dossier ${label}`;
  }

  return `${SITE} - ${label}`;
};
