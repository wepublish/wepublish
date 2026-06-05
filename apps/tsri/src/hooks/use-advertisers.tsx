import { BlockFormat } from '@wepublish/richtext';
import { FullAuthorFragment } from '@wepublish/website/api';
import { useMemo } from 'react';
import { Descendant } from 'slate';

const SPONSOR_TAG = 'sponsor';
const PROMO_TAG = 'promo';

const PROMO_BIO_TEXT =
  'Dieser Beitrag wurde von unserem Promo-Partner verfasst und durch Tsüri veröffentlicht – dem kritischen Zürcher Stadtmagazin für Lokaljournalismus.';

const SPONSOR_BIO_TEXT =
  'Dieser Beitrag wurde von unserem Sponsor verfasst und durch Tsüri veröffentlicht – dem kritischen Zürcher Stadtmagazin für Lokaljournalismus.';
export function isPromo(author: FullAuthorFragment): boolean {
  return !!author.tags?.find(tag => tag.tag === PROMO_TAG);
}

export function isSponsor(author: FullAuthorFragment): boolean {
  return !!author.tags?.find(tag => tag.tag === SPONSOR_TAG);
}

export function getAdvertiserBio(author: FullAuthorFragment): Descendant[] {
  const bioText = isPromo(author) ? PROMO_BIO_TEXT : SPONSOR_BIO_TEXT;

  return [
    {
      type: BlockFormat.Paragraph,
      children: [{ text: bioText }],
    },
  ];
}

export const useAdvertisers = (
  authors?: FullAuthorFragment[]
): FullAuthorFragment[] | undefined => {
  const advertisers = useMemo(
    () => authors?.filter(author => isSponsor(author) || isPromo(author)),
    [authors]
  );

  return advertisers;
};
