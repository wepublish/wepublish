import { mockTag } from '@wepublish/mocks/website';

import { EENEWS_DOSSIER_INDEX_TITLE, eenewsTagTitle } from './eenews-tag-title';

describe('eenews tag titles', () => {
  it('titles the dossier overview', () => {
    expect(EENEWS_DOSSIER_INDEX_TITLE).toBe('ee-news - Alle Dossiers');
  });

  it('titles a topic (main tag) with its label', () => {
    expect(eenewsTagTitle(mockTag({ tag: 'wasser', main: true }))).toBe(
      'ee-news - Thema «Wasser»'
    );
  });

  it('titles a whitelisted dossier tag with its display label', () => {
    expect(eenewsTagTitle(mockTag({ tag: 'the smarter e', main: false }))).toBe(
      'ee-news - Dossier «The Smarter E»'
    );
  });

  it('titles any other tag with just its label', () => {
    expect(eenewsTagTitle(mockTag({ tag: 'photovoltaik', main: false }))).toBe(
      'ee-news - «Photovoltaik»'
    );
  });
});
