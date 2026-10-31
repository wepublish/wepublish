import { BadRequestException } from '@nestjs/common';
import { isBefore, isValid, parseISO } from 'date-fns';
import { z } from 'zod';

export const MAX_PUCK_BLOCKS_LENGTH = 1_000_000;
export const MAX_PUCK_BLOCKS_DEPTH = 64;

export const defaultPuckSlot = 'content';

export const puckWeekdays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const puckBreakpoints = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

export const puckListDatasourceTypes = ['list', 'uniqueList', 'slot'] as const;

export const puckDatasourceTypes = [
  ...puckListDatasourceTypes,
  'single',
  'multiple',
] as const;

export const puckDatasourceModels = [
  'article',
  'page',
  'event',
  'image',
  'memberPlan',
] as const;

export const puckTextAligns = ['left', 'center', 'right'] as const;

export const puckFontWeights = ['light', 'regular', 'medium', 'bold'] as const;

export const puckTextTransforms = [
  'none',
  'uppercase',
  'lowercase',
  'capitalize',
] as const;

export const puckBackgroundSizes = ['cover', 'contain', 'auto'] as const;

export const puckBackgroundPositions = [
  'left top',
  'center top',
  'right top',
  'left center',
  'center center',
  'right center',
  'left bottom',
  'center bottom',
  'right bottom',
] as const;

export const puckBorderStyles = ['solid', 'dashed', 'dotted'] as const;

export const puckMaxWidthBreakpoints = ['sm', 'md', 'lg', 'xl'] as const;

export const puckMaxShadow = 24;

const reservedDataKeys = [
  'id',
  'locked',
  'visibility',
  'styling',
  'datasources',
];

const SLOT_PATH = /^[^.[\]]+(\[\d{1,3}\])*(\.[^.[\]]+(\[\d{1,3}\])*)*$/;
const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d$/;
const ZONED_DATE_TIME = /T.+(Z|[+-]\d{2}:?\d{2})$/i;
const THEME_COLOR_PATH = /^[a-z][a-z0-9]*\.[a-z0-9]+$/i;
const HEX_COLOR = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const PIXELS = /^\d+(\.\d+)?px$/;
const MIN_HEIGHT = /^\d+(\.\d+)?(px|vh)$/;
const MAX_WIDTH_LENGTH = /^\d+(\.\d+)?(px|%)$/;

const spacingMessage = 'must be theme spacing units or pixels like 12px';
const minHeightMessage =
  'must be pixels like 320px or viewport height like 50vh';
const maxWidthMessage = `must be a breakpoint (${puckMaxWidthBreakpoints.join(', ')}), pixels like 640px or percent like 80%`;
const colorMessage =
  'must be a theme colour like primary.main or a hex colour like #1a1a1a';
const dateTimeMessage = 'must be a date time with a time zone';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isComponent = (value: unknown) =>
  isRecord(value) &&
  typeof value['type'] === 'string' &&
  isRecord(value['props']) &&
  typeof value['props']['id'] === 'string';

const withoutNullEntries = (value: unknown) =>
  isRecord(value) ?
    Object.fromEntries(
      Object.entries(value).filter(([, entry]) => entry !== null)
    )
  : value;

const messageFor = (message: string) => () => ({ message });

const strictObject = <Shape extends z.ZodRawShape>(shape: Shape) =>
  z.preprocess(withoutNullEntries, z.object(shape).strict());

const nonEmptyString = z.string().min(1, 'must not be empty');

const percentSchema = z.number().min(0).max(100);

const colorSchema = z
  .string()
  .refine(value => THEME_COLOR_PATH.test(value) || HEX_COLOR.test(value), {
    message: colorMessage,
  });

export const puckSpacingSchema = z.union(
  [
    z.number().min(0, spacingMessage),
    z
      .string()
      .regex(PIXELS, spacingMessage)
      .transform(value => value as `${number}px`),
  ],
  { errorMap: messageFor(spacingMessage) }
);

export const puckMinHeightSchema = z
  .string({ errorMap: messageFor(minHeightMessage) })
  .regex(MIN_HEIGHT, minHeightMessage)
  .transform(value => value as `${number}${'px' | 'vh'}`);

export const puckMaxWidthSchema = z.union(
  [
    z.enum(puckMaxWidthBreakpoints),
    z
      .string()
      .regex(MAX_WIDTH_LENGTH, maxWidthMessage)
      .transform(value => value as `${number}${'px' | '%'}`),
  ],
  { errorMap: messageFor(maxWidthMessage) }
);

export const puckBackgroundPositionSchema = z.enum(puckBackgroundPositions);

const sidesSchema = <Side extends z.ZodTypeAny>(side: Side) =>
  strictObject({
    top: side.optional(),
    right: side.optional(),
    bottom: side.optional(),
    left: side.optional(),
  });

const dateTimeSchema = z
  .union(
    [z.instanceof(Date), z.string().regex(ZONED_DATE_TIME, dateTimeMessage)],
    { errorMap: messageFor(dateTimeMessage) }
  )
  .transform(value => (typeof value === 'string' ? parseISO(value) : value))
  .refine(isValid, { message: 'must be a valid date time' })
  .transform(date => date.toISOString());

const timeOfDaySchema = z
  .string()
  .regex(TIME_OF_DAY, 'must be a time of day as HH:MM');

const endsAfterItStarts = ({ from, to }: { from?: unknown; to?: unknown }) =>
  typeof from !== 'string' ||
  typeof to !== 'string' ||
  isBefore(parseISO(from), parseISO(to));

export const apiBlockTimingsSchema = strictObject({
  from: dateTimeSchema.optional(),
  to: dateTimeSchema.optional(),
  weekdays: z.array(z.enum(puckWeekdays)).optional(),
  timeOfDay: strictObject({
    from: timeOfDaySchema,
    to: timeOfDaySchema,
  }).optional(),
}).refine(endsAfterItStarts, {
  message: 'must be after the start',
  path: ['to'],
});

export const apiBlockVisibilitySchema = strictObject({
  disabled: z.boolean().optional(),
  timings: apiBlockTimingsSchema.optional(),
  breakpoints: z.array(z.enum(puckBreakpoints)).optional(),
});

const listDatasourceSchema = <Type extends string>(type: Type) =>
  z.object({ type: z.literal(type) }).strict();

const listDatasourceOptions = [
  listDatasourceSchema('list'),
  listDatasourceSchema('uniqueList'),
  listDatasourceSchema('slot'),
] as const;

export const apiBlockListDatasourceSchema = z.preprocess(
  withoutNullEntries,
  z.discriminatedUnion('type', [...listDatasourceOptions])
);

export const apiBlockDatasourceSchema = z.preprocess(
  withoutNullEntries,
  z.discriminatedUnion('type', [
    ...listDatasourceOptions,
    z.object({ type: z.literal('single'), id: z.string() }).strict(),
    z
      .object({ type: z.literal('multiple'), ids: z.array(z.string()) })
      .strict(),
  ])
);

export const apiBlockDatasourcesSchema = strictObject({
  article: apiBlockDatasourceSchema.optional(),
  page: apiBlockDatasourceSchema.optional(),
  event: apiBlockDatasourceSchema.optional(),
  image: apiBlockDatasourceSchema.optional(),
  memberPlan: apiBlockDatasourceSchema.optional(),
  userSubscription: apiBlockListDatasourceSchema.optional(),
});

const apiBlockStylingShape = {
  typography: nonEmptyString.optional(),
  textAlign: z.enum(puckTextAligns).optional(),
  color: colorSchema.optional(),
  fontWeight: z.enum(puckFontWeights).optional(),
  textTransform: z.enum(puckTextTransforms).optional(),
  background: colorSchema.optional(),
  backgroundImage: nonEmptyString.optional(),
  backgroundSize: z.enum(puckBackgroundSizes).optional(),
  backgroundPosition: puckBackgroundPositionSchema.optional(),
  overlay: colorSchema.optional(),
  overlayOpacity: percentSchema.optional(),
  margin: sidesSchema(puckSpacingSchema).optional(),
  padding: sidesSchema(puckSpacingSchema).optional(),
  border: strictObject({
    width: sidesSchema(z.number().min(0)).optional(),
    style: z.enum(puckBorderStyles).optional(),
    color: colorSchema.optional(),
  }).optional(),
  borderRadius: strictObject({
    topLeft: puckSpacingSchema.optional(),
    topRight: puckSpacingSchema.optional(),
    bottomRight: puckSpacingSchema.optional(),
    bottomLeft: puckSpacingSchema.optional(),
  }).optional(),
  minHeight: puckMinHeightSchema.optional(),
  maxWidth: puckMaxWidthSchema.optional(),
  shadow: z.number().int().min(0).max(puckMaxShadow).optional(),
  opacity: percentSchema.optional(),
};

export const apiBlockStylingKeys = Object.keys(
  apiBlockStylingShape
) as (keyof typeof apiBlockStylingShape)[];

export const apiBlockStylingSchema = strictObject(apiBlockStylingShape);

const componentPaths = (
  value: unknown,
  path: (string | number)[]
): (string | number)[][] =>
  isComponent(value) ? [path]
  : Array.isArray(value) ?
    value.flatMap((entry, index) => componentPaths(entry, [...path, index]))
  : isRecord(value) ?
    Object.entries(value).flatMap(([key, entry]) =>
      componentPaths(entry, [...path, key])
    )
  : [];

export const apiBlockDataSchema = z
  .record(z.string(), z.unknown())
  .superRefine((data, ctx) => {
    reservedDataKeys
      .filter(key => key in data)
      .forEach(key =>
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: 'belongs on the block, not inside its data',
        })
      );

    componentPaths(data, []).forEach(path =>
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path,
        message: 'must not be a component, nest it through children',
      })
    );
  });

const apiBlockShape = {
  id: nonEmptyString,
  type: nonEmptyString,
  locked: z.boolean().optional(),
  visibility: apiBlockVisibilitySchema.optional(),
  styling: apiBlockStylingSchema.optional(),
  datasources: apiBlockDatasourcesSchema.optional(),
  data: apiBlockDataSchema,
  slot: z
    .string()
    .regex(SLOT_PATH, 'must be a slot path like items[0].content')
    .optional(),
};

export type PuckSpacingValue = z.output<typeof puckSpacingSchema>;
export type ApiBlockWeekday = (typeof puckWeekdays)[number];
export type ApiBlockBreakpoint = (typeof puckBreakpoints)[number];
export type ApiBlockTimings = z.output<typeof apiBlockTimingsSchema>;
export type ApiBlockVisibility = z.output<typeof apiBlockVisibilitySchema>;
export type ApiBlockDatasource = z.output<typeof apiBlockDatasourceSchema>;
export type ApiBlockListDatasource = z.output<
  typeof apiBlockListDatasourceSchema
>;
export type ApiBlockDatasources = z.output<typeof apiBlockDatasourcesSchema>;
export type ApiBlockStyling = z.output<typeof apiBlockStylingSchema>;
export type ApiBlockData = z.output<typeof apiBlockDataSchema>;

export type ApiBlock = z.output<z.ZodObject<typeof apiBlockShape>> & {
  children?: ApiBlock[];
};

export const apiBlockSchema: z.ZodType<ApiBlock, z.ZodTypeDef, unknown> =
  strictObject({
    ...apiBlockShape,
    children: z.lazy(() => z.array(apiBlockSchema)).optional(),
  });

export const apiBlocksSchema = z.array(apiBlockSchema);

export class PuckBlocksError extends BadRequestException {}

const expectedTypeNames: Record<string, string> = {
  array: 'a list',
  object: 'an object',
  integer: 'an integer',
  date: 'a date',
};

const articleFor = (expected: string) =>
  expectedTypeNames[expected] ?? `a ${expected}`;

const puckBlocksErrorMap: z.ZodErrorMap = (issue, { defaultError }) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      return {
        message:
          issue.received === z.ZodParsedType.undefined ?
            'is required'
          : `must be ${articleFor(issue.expected)}`,
      };
    case z.ZodIssueCode.unrecognized_keys:
      return { message: `must not have ${issue.keys.join(', ')}` };
    case z.ZodIssueCode.invalid_enum_value:
    case z.ZodIssueCode.invalid_union_discriminator:
      return { message: `must be one of ${issue.options.join(', ')}` };
    case z.ZodIssueCode.too_small:
      return { message: `must be at least ${issue.minimum}` };
    case z.ZodIssueCode.too_big:
      return { message: `must be at most ${issue.maximum}` };
    default:
      return { message: defaultError };
  }
};

const formatPath = (path: (string | number)[]) =>
  path
    .map(segment =>
      typeof segment === 'number' ? `[${segment}]` : `.${segment}`
    )
    .join('');

const valueTooDeep = (value: unknown, depth: number): boolean =>
  (Array.isArray(value) || isRecord(value)) &&
  (depth > MAX_PUCK_BLOCKS_DEPTH ||
    Object.values(value).some(entry => valueTooDeep(entry, depth + 1)));

const blockTooDeep = (block: unknown, depth: number): boolean =>
  depth > MAX_PUCK_BLOCKS_DEPTH ||
  (isRecord(block) ?
    Object.entries(block).some(([key, entry]) =>
      key === 'children' && Array.isArray(entry) ?
        entry.some(child => blockTooDeep(child, depth + 1))
      : valueTooDeep(entry, depth)
    )
  : valueTooDeep(block, depth));

export function parsePuckBlocks(value: unknown): ApiBlock[] {
  if (Array.isArray(value) && value.some(block => blockTooDeep(block, 1))) {
    throw new PuckBlocksError(
      `Puck blocks are nested too deep (at most ${MAX_PUCK_BLOCKS_DEPTH} levels).`
    );
  }

  if (JSON.stringify(value ?? null).length > MAX_PUCK_BLOCKS_LENGTH) {
    throw new PuckBlocksError(
      `Puck blocks are too large (at most ${MAX_PUCK_BLOCKS_LENGTH} characters).`
    );
  }

  const result = apiBlocksSchema.safeParse(value, {
    errorMap: puckBlocksErrorMap,
  });

  if (!result.success) {
    const [{ path, message }] = result.error.issues;

    throw new PuckBlocksError(
      `Puck blocks are invalid: blocks${formatPath(path)} ${message}.`
    );
  }

  return result.data;
}

export const filterPuckBlocks = (
  blocks: ApiBlock[],
  keep: (block: ApiBlock) => boolean
): ApiBlock[] => {
  let changed = false;
  const kept: ApiBlock[] = [];

  for (const block of blocks) {
    if (!keep(block)) {
      changed = true;
      continue;
    }

    const children = block.children && filterPuckBlocks(block.children, keep);

    if (children === block.children) {
      kept.push(block);
      continue;
    }

    changed = true;
    kept.push({ ...block, children });
  }

  return changed ? kept : blocks;
};
