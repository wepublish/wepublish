import { Data } from '@puckeditor/core';
import {
  PuckBlockInput,
  PuckBlockKind,
  PuckBlockTimingsInput,
  PuckBlockVisibilityInput,
  PuckRegistryInput,
} from '@wepublish/editor/api';

import { compact, ifPresent } from '../document/graphql-values';
import {
  DerivedDatasources,
  PuckSlotConfig,
  toPuckBlockInputs,
} from '../document/puck-blocks';
import { dynamicConfigOf, readDynamicConfig } from '../document/puck-registry';

export type PreviewBlockInput = Pick<
  PuckBlockInput,
  | 'id'
  | 'kind'
  | 'type'
  | 'props'
  | 'visibility'
  | 'datasources'
  | 'consumes'
  | 'puckSlot'
> & { children?: PreviewBlockInput[] };

export type PreviewSkeleton = {
  puckBlocks: PreviewBlockInput[];
  puckRegistry: PuckRegistryInput | null;
};

const ZONED_DATE_TIME = /^\d{4}-\d{2}-\d{2}T.+(Z|[+-]\d{2}:?\d{2})$/i;
const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d$/;

const isDateTime = (value: unknown) =>
  value === undefined ||
  value === null ||
  (typeof value === 'string' &&
    ZONED_DATE_TIME.test(value) &&
    !Number.isNaN(Date.parse(value)));

const isTimeOfDay = (value: unknown) =>
  typeof value === 'string' && TIME_OF_DAY.test(value);

const isSendableTiming = ({ from, to, timeOfDay }: PuckBlockTimingsInput) =>
  isDateTime(from) &&
  isDateTime(to) &&
  (!from || !to || Date.parse(from) < Date.parse(to)) &&
  (!timeOfDay || (isTimeOfDay(timeOfDay.from) && isTimeOfDay(timeOfDay.to)));

const toPreviewVisibility = ({
  timings,
  ...visibility
}: PuckBlockVisibilityInput): PuckBlockVisibilityInput => ({
  ...visibility,
  ...compact({
    timings: ifPresent(timings, timing =>
      isSendableTiming(timing) ? timing : undefined
    ),
  }),
});

const toPreviewBlock = ({
  id,
  kind,
  type,
  visibility,
  datasources,
  consumes,
  puckSlot,
  children,
}: PuckBlockInput): PreviewBlockInput => ({
  id,
  kind,
  type,
  props: {},
  ...compact({
    visibility: ifPresent(visibility, toPreviewVisibility),
    datasources,
    consumes,
    puckSlot,
  }),
  ...(children?.length ? { children: children.map(toPreviewBlock) } : {}),
});

const generatedTypes = (blocks: readonly PreviewBlockInput[]): string[] =>
  blocks.flatMap(({ kind, type, children }) => [
    ...(kind === PuckBlockKind.Generated ? [type] : []),
    ...generatedTypes(children ?? []),
  ]);

const toPreviewRegistry = (
  blocks: readonly PreviewBlockInput[]
): PuckRegistryInput | null => {
  const types = Array.from(new Set(generatedTypes(blocks)));

  return types.length ?
      {
        components: Object.fromEntries(types.map(type => [type, { html: '' }])),
      }
    : null;
};

export const toPreviewSkeleton = (
  data: Data,
  config: PuckSlotConfig,
  derivedDatasources?: DerivedDatasources
): PreviewSkeleton => {
  const dynamicConfig = readDynamicConfig(dynamicConfigOf(data.root.props));
  const puckBlocks = data.content.flatMap(component => {
    try {
      return toPuckBlockInputs([component], {
        config,
        dynamicConfig,
        derivedDatasources,
      }).map(toPreviewBlock);
    } catch {
      return [];
    }
  });

  return { puckBlocks, puckRegistry: toPreviewRegistry(puckBlocks) };
};

const hasDatasources = ({
  datasources,
  children,
}: PreviewBlockInput): boolean =>
  Object.keys(datasources ?? {}).length > 0 ||
  (children ?? []).some(hasDatasources);

export const hasPreviewDatasources = ({ puckBlocks }: PreviewSkeleton) =>
  puckBlocks.some(hasDatasources);
