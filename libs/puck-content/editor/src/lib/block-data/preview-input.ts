import { Data } from '@puckeditor/core';
import type {
  PuckBlockDatasourceInput as EditorDatasourceInput,
  PuckBlockDatasourcesInput as EditorDatasourcesInput,
  PuckBlockTimingsInput as EditorTimingsInput,
  PuckBlockVisibilityInput as EditorVisibilityInput,
} from '@wepublish/editor/api';
import {
  PuckBlockDatasourceInput,
  PuckBlockDatasourcesInput,
  PuckBlockInput,
  PuckBlockKind,
  PuckBlocksPreviewQueryVariables,
  PuckBlockTimingsInput,
  PuckBlockVisibilityInput,
  PuckBreakpoint,
  PuckDatasourceType,
  PuckListDatasourceType,
  PuckWeekday,
} from '@wepublish/website/api';

import { compact, enumMember, ifPresent } from '../document/graphql-values';
import { DerivedDatasources, PuckSlotConfig } from '../document/puck-blocks';
import {
  hasPreviewDatasources,
  PreviewBlockInput,
  PreviewSkeleton,
  toPreviewSkeleton,
} from './preview-skeleton';

const toTimings = ({
  weekdays,
  ...timings
}: EditorTimingsInput): PuckBlockTimingsInput => ({
  ...timings,
  ...compact({
    weekdays: weekdays?.map(weekday => enumMember(PuckWeekday, weekday)),
  }),
});

const toVisibility = ({
  breakpoints,
  timings,
  ...visibility
}: EditorVisibilityInput): PuckBlockVisibilityInput => ({
  ...visibility,
  ...compact({
    breakpoints: breakpoints?.map(breakpoint =>
      enumMember(PuckBreakpoint, breakpoint)
    ),
    timings: ifPresent(timings, toTimings),
  }),
});

const toDatasource = ({
  type,
  ...datasource
}: EditorDatasourceInput): PuckBlockDatasourceInput => ({
  type: enumMember(PuckDatasourceType, type),
  ...datasource,
});

const toDatasources = ({
  article,
  page,
  event,
  image,
  memberPlan,
  userSubscription,
}: EditorDatasourcesInput): PuckBlockDatasourcesInput =>
  compact({
    article: ifPresent(article, toDatasource),
    page: ifPresent(page, toDatasource),
    event: ifPresent(event, toDatasource),
    image: ifPresent(image, toDatasource),
    memberPlan: ifPresent(memberPlan, toDatasource),
    userSubscription: ifPresent(userSubscription, ({ type }) => ({
      type: enumMember(PuckListDatasourceType, type),
    })),
  });

const toBlock = ({
  id,
  kind,
  type,
  props,
  visibility,
  datasources,
  consumes,
  puckSlot,
  children,
}: PreviewBlockInput): PuckBlockInput => ({
  id,
  kind: enumMember(PuckBlockKind, kind),
  type,
  props,
  ...compact({
    visibility: ifPresent(visibility, toVisibility),
    datasources: ifPresent(datasources, toDatasources),
    consumes,
    puckSlot,
  }),
  ...(children?.length ? { children: children.map(toBlock) } : {}),
});

export const toPreviewInput = ({
  puckBlocks,
  puckRegistry,
}: PreviewSkeleton): PuckBlocksPreviewQueryVariables => ({
  puckBlocks: puckBlocks.map(toBlock),
  puckRegistry,
});

export const toPreviewVariables = (
  data: Data,
  config: PuckSlotConfig,
  derivedDatasources?: DerivedDatasources
): PuckBlocksPreviewQueryVariables | null => {
  const skeleton = toPreviewSkeleton(data, config, derivedDatasources);

  return hasPreviewDatasources(skeleton) ? toPreviewInput(skeleton) : null;
};
