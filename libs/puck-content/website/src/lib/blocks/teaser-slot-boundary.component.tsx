import { ReactNode } from 'react';

import { TeaserSlotContext } from '../contexts/teaser-slot.context';
import { PuckBlockData } from './block.types';
import { PuckDatasources } from './graphql-shape';
import { teaserFromData, teaserSlotModel } from './teaser-from-data';

export type TeaserSlotBoundaryProps = {
  datasources: PuckDatasources | null | undefined;
  data: PuckBlockData;
  children?: ReactNode;
};

export const TeaserSlotBoundary = ({
  datasources,
  data,
  children,
}: TeaserSlotBoundaryProps) => {
  const model = teaserSlotModel(datasources);

  if (!model) {
    return children;
  }

  return (
    <TeaserSlotContext.Provider value={teaserFromData(model, data)}>
      {children}
    </TeaserSlotContext.Provider>
  );
};
