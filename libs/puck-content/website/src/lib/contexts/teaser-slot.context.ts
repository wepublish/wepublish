import { FullTeaserFragment } from '@wepublish/website/api';
import { createContext, useContext } from 'react';

export type TeaserSlotValue = FullTeaserFragment | null | undefined;

export const TeaserSlotContext = createContext<TeaserSlotValue>(undefined);

export const useTeaserSlot = () => {
  const teaser = useContext(TeaserSlotContext);

  if (teaser === undefined) {
    throw new Error(
      'useTeaserSlot must be used within a <TeaserSlotContext.Provider>'
    );
  }

  return teaser;
};
