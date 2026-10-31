import {
  Field,
  Float,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

import {
  PuckBackgroundPositionScalar,
  PuckMaxWidthScalar,
  PuckMinHeightScalar,
  PuckSpacingScalar,
} from './puck-block.scalars';
import {
  ApiBlockData,
  ApiBlockStyling,
  puckBackgroundSizes,
  puckBorderStyles,
  puckBreakpoints,
  puckDatasourceTypes,
  puckFontWeights,
  puckListDatasourceTypes,
  PuckSpacingValue,
  puckTextAligns,
  puckTextTransforms,
  puckWeekdays,
} from './puck-blocks';

const enumOf = <Value extends string>(values: readonly Value[]) =>
  Object.fromEntries(values.map(value => [value, value])) as {
    [Key in Value]: Key;
  };

export const PuckWeekday = enumOf(puckWeekdays);
export type PuckWeekday = (typeof puckWeekdays)[number];

export const PuckBreakpoint = enumOf(puckBreakpoints);
export type PuckBreakpoint = (typeof puckBreakpoints)[number];

export const PuckDatasourceType = enumOf(puckDatasourceTypes);
export type PuckDatasourceType = (typeof puckDatasourceTypes)[number];

export const PuckListDatasourceType = enumOf(puckListDatasourceTypes);
export type PuckListDatasourceType = (typeof puckListDatasourceTypes)[number];

export const PuckTextAlign = enumOf(puckTextAligns);
export type PuckTextAlign = (typeof puckTextAligns)[number];

export const PuckFontWeight = enumOf(puckFontWeights);
export type PuckFontWeight = (typeof puckFontWeights)[number];

export const PuckTextTransform = enumOf(puckTextTransforms);
export type PuckTextTransform = (typeof puckTextTransforms)[number];

export const PuckBackgroundSize = enumOf(puckBackgroundSizes);
export type PuckBackgroundSize = (typeof puckBackgroundSizes)[number];

export const PuckBorderStyle = enumOf(puckBorderStyles);
export type PuckBorderStyle = (typeof puckBorderStyles)[number];

registerEnumType(PuckWeekday, {
  name: 'PuckWeekday',
  description: 'A day of the week, used to time Puck blocks.',
});

registerEnumType(PuckBreakpoint, {
  name: 'PuckBreakpoint',
  description: 'A theme breakpoint, from the smallest to the largest screen.',
});

registerEnumType(PuckDatasourceType, {
  name: 'PuckDatasourceType',
  description:
    'How a Puck block loads its records: `list` loads the latest, `uniqueList` the latest not shown elsewhere on the page, `slot` takes them from the parent, `single` picks one by id and `multiple` several by ids.',
});

registerEnumType(PuckListDatasourceType, {
  name: 'PuckListDatasourceType',
  description:
    'The datasource types that load records instead of picking them by id.',
});

registerEnumType(PuckTextAlign, { name: 'PuckTextAlign' });
registerEnumType(PuckFontWeight, { name: 'PuckFontWeight' });
registerEnumType(PuckTextTransform, { name: 'PuckTextTransform' });
registerEnumType(PuckBackgroundSize, { name: 'PuckBackgroundSize' });
registerEnumType(PuckBorderStyle, { name: 'PuckBorderStyle' });

@ObjectType('PuckBlockTimeOfDay')
@InputType('PuckBlockTimeOfDayInput')
export class PuckBlockTimeOfDay {
  @Field(() => String, {
    description: 'Start of the daily window, as `HH:MM` in the site timezone.',
  })
  from!: string;

  @Field(() => String, {
    description:
      'End of the daily window, as `HH:MM` in the site timezone. An end before the start wraps over midnight.',
  })
  to!: string;
}

@ObjectType('PuckBlockTimings')
@InputType('PuckBlockTimingsInput')
export class PuckBlockTimings {
  @Field(() => Date, {
    nullable: true,
    description: 'The block is hidden before this moment.',
  })
  from?: Date | null;

  @Field(() => Date, {
    nullable: true,
    description:
      'The block is hidden from this moment on. Has to be after `from`.',
  })
  to?: Date | null;

  @Field(() => [PuckWeekday], {
    nullable: true,
    description:
      'The block is only shown on these weekdays. Empty means every day.',
  })
  weekdays?: PuckWeekday[] | null;

  @Field(() => PuckBlockTimeOfDay, {
    nullable: true,
    description: 'The block is only shown during this daily window.',
  })
  timeOfDay?: PuckBlockTimeOfDay | null;
}

@ObjectType('PuckBlockVisibility')
@InputType('PuckBlockVisibilityInput')
export class PuckBlockVisibility {
  @Field(() => Boolean, {
    nullable: true,
    description: 'Hides the block everywhere while keeping it in the document.',
  })
  disabled?: boolean | null;

  @Field(() => PuckBlockTimings, { nullable: true })
  timings?: PuckBlockTimings | null;

  @Field(() => [PuckBreakpoint], {
    nullable: true,
    description:
      'The breakpoints the block is shown on. Omitted means every screen size. The website hides the block, the API never prunes by breakpoint.',
  })
  breakpoints?: PuckBreakpoint[] | null;
}

@ObjectType('PuckBlockDatasource')
@InputType('PuckBlockDatasourceInput')
export class PuckBlockDatasource {
  @Field(() => PuckDatasourceType)
  type!: PuckDatasourceType;

  @Field(() => String, {
    nullable: true,
    description: 'The picked record, only with `single`.',
  })
  id?: string | null;

  @Field(() => [String], {
    nullable: true,
    description: 'The picked records in display order, only with `multiple`.',
  })
  ids?: string[] | null;
}

@ObjectType('PuckBlockListDatasource')
@InputType('PuckBlockListDatasourceInput')
export class PuckBlockListDatasource {
  @Field(() => PuckListDatasourceType)
  type!: PuckListDatasourceType;
}

@ObjectType('PuckBlockDatasources', {
  description:
    'The CMS records a Puck block shows, one entry per model. The website resolves them, the API only stores the choice.',
})
@InputType('PuckBlockDatasourcesInput')
export class PuckBlockDatasources {
  @Field(() => PuckBlockDatasource, { nullable: true })
  article?: PuckBlockDatasource | null;

  @Field(() => PuckBlockDatasource, { nullable: true })
  page?: PuckBlockDatasource | null;

  @Field(() => PuckBlockDatasource, { nullable: true })
  event?: PuckBlockDatasource | null;

  @Field(() => PuckBlockDatasource, { nullable: true })
  image?: PuckBlockDatasource | null;

  @Field(() => PuckBlockDatasource, { nullable: true })
  memberPlan?: PuckBlockDatasource | null;

  @Field(() => PuckBlockListDatasource, { nullable: true })
  userSubscription?: PuckBlockListDatasource | null;
}

@ObjectType('PuckSpacingSides')
@InputType('PuckSpacingSidesInput')
export class PuckSpacingSides {
  @Field(() => PuckSpacingScalar, { nullable: true })
  top?: PuckSpacingValue | null;

  @Field(() => PuckSpacingScalar, { nullable: true })
  right?: PuckSpacingValue | null;

  @Field(() => PuckSpacingScalar, { nullable: true })
  bottom?: PuckSpacingValue | null;

  @Field(() => PuckSpacingScalar, { nullable: true })
  left?: PuckSpacingValue | null;
}

@ObjectType('PuckBorderWidth', { description: 'Border width per side.' })
@InputType('PuckBorderWidthInput')
export class PuckBorderWidth {
  @Field(() => Float, { nullable: true, description: 'In pixels.' })
  top?: number | null;

  @Field(() => Float, { nullable: true, description: 'In pixels.' })
  right?: number | null;

  @Field(() => Float, { nullable: true, description: 'In pixels.' })
  bottom?: number | null;

  @Field(() => Float, { nullable: true, description: 'In pixels.' })
  left?: number | null;
}

@ObjectType('PuckBorder')
@InputType('PuckBorderInput')
export class PuckBorder {
  @Field(() => PuckBorderWidth, { nullable: true })
  width?: PuckBorderWidth | null;

  @Field(() => PuckBorderStyle, { nullable: true })
  style?: PuckBorderStyle | null;

  @Field(() => String, {
    nullable: true,
    description:
      'A theme colour path or a hex colour, defaults to the text colour.',
  })
  color?: string | null;
}

@ObjectType('PuckBorderRadius', {
  description:
    'Corner radius per corner, in multiples of the theme radius or pixels.',
})
@InputType('PuckBorderRadiusInput')
export class PuckBorderRadius {
  @Field(() => PuckSpacingScalar, { nullable: true })
  topLeft?: PuckSpacingValue | null;

  @Field(() => PuckSpacingScalar, { nullable: true })
  topRight?: PuckSpacingValue | null;

  @Field(() => PuckSpacingScalar, { nullable: true })
  bottomRight?: PuckSpacingValue | null;

  @Field(() => PuckSpacingScalar, { nullable: true })
  bottomLeft?: PuckSpacingValue | null;
}

const colorDescription =
  'A theme colour path like `primary.main` or a hex colour like `#1a1a1a`.';

@ObjectType('PuckBlockStyling', {
  description:
    'The styling tab of a Puck block. Omitted keys keep the component default.',
})
@InputType('PuckBlockStylingInput')
export class PuckBlockStyling {
  @Field(() => String, {
    nullable: true,
    description: 'Name of a theme typography variant like `h2` or `body1`.',
  })
  typography?: string | null;

  @Field(() => PuckTextAlign, { nullable: true })
  textAlign?: PuckTextAlign | null;

  @Field(() => String, { nullable: true, description: colorDescription })
  color?: string | null;

  @Field(() => PuckFontWeight, { nullable: true })
  fontWeight?: PuckFontWeight | null;

  @Field(() => PuckTextTransform, { nullable: true })
  textTransform?: PuckTextTransform | null;

  @Field(() => String, { nullable: true, description: colorDescription })
  background?: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'Id of the image shown as background.',
  })
  backgroundImage?: string | null;

  @Field(() => PuckBackgroundSize, { nullable: true })
  backgroundSize?: PuckBackgroundSize | null;

  @Field(() => PuckBackgroundPositionScalar, { nullable: true })
  backgroundPosition?: ApiBlockStyling['backgroundPosition'] | null;

  @Field(() => String, {
    nullable: true,
    description: `Colour laid over the background. ${colorDescription}`,
  })
  overlay?: string | null;

  @Field(() => Float, {
    nullable: true,
    description: 'Opacity of the overlay in percent, 0 to 100.',
  })
  overlayOpacity?: number | null;

  @Field(() => PuckSpacingSides, { nullable: true })
  margin?: PuckSpacingSides | null;

  @Field(() => PuckSpacingSides, { nullable: true })
  padding?: PuckSpacingSides | null;

  @Field(() => PuckBorder, { nullable: true })
  border?: PuckBorder | null;

  @Field(() => PuckBorderRadius, { nullable: true })
  borderRadius?: PuckBorderRadius | null;

  @Field(() => PuckMinHeightScalar, { nullable: true })
  minHeight?: ApiBlockStyling['minHeight'] | null;

  @Field(() => PuckMaxWidthScalar, { nullable: true })
  maxWidth?: ApiBlockStyling['maxWidth'] | null;

  @Field(() => Int, {
    nullable: true,
    description: 'Theme shadow elevation, 0 to 24.',
  })
  shadow?: number | null;

  @Field(() => Float, {
    nullable: true,
    description: 'Opacity of the whole block in percent, 0 to 100.',
  })
  opacity?: number | null;
}

// Reads are flat on purpose. A GraphQL query has to spell out every level it
// selects, so a tree of unknown depth cannot be returned: each query would
// nest a fixed number of fragments and silently miss the blocks below.
// Input objects may nest arbitrarily, so writes stay a typed recursive tree
// (PuckBlockInput), while reads are this flat list in depth-first order whose
// parentId, slot and position let clients rebuild the tree.
@ObjectType({
  description:
    'A Puck block in a flat list, parents before their children. Rebuild the tree by grouping on `parentId` and `slot` and sorting by `position`.',
})
export class PuckBlock {
  @Field(() => String)
  id!: string;

  @Field(() => String, { description: 'The component name.' })
  type!: string;

  @Field(() => String, {
    nullable: true,
    description: 'The block this one is nested in, null at the top level.',
  })
  parentId!: string | null;

  @Field(() => String, {
    nullable: true,
    description:
      'The slot path inside the parent data, like `items[2].content`. Null at the top level, `content` by default.',
  })
  slot!: string | null;

  @Field(() => Int, {
    description: 'The index of the block within its parent slot.',
  })
  position!: number;

  @Field(() => Boolean, { nullable: true })
  locked?: boolean | null;

  @Field(() => PuckBlockVisibility, { nullable: true })
  visibility?: PuckBlockVisibility | null;

  @Field(() => PuckBlockStyling, { nullable: true })
  styling?: PuckBlockStyling | null;

  @Field(() => PuckBlockDatasources, { nullable: true })
  datasources?: PuckBlockDatasources | null;

  @Field(() => GraphQLJSONObject, {
    description:
      'The component props, with every slot emptied to `[]`: the blocks of a slot are the ones pointing at it.',
  })
  data!: ApiBlockData;
}

@InputType({
  description: 'A Puck block with its children, nested as deep as needed.',
})
export class PuckBlockInput {
  @Field(() => String)
  id!: string;

  @Field(() => String, { description: 'The component name.' })
  type!: string;

  @Field(() => GraphQLJSONObject, {
    description:
      'The component props without id, locked, visibility, styling and datasources, with every slot emptied to `[]`.',
  })
  data!: ApiBlockData;

  @Field(() => Boolean, { nullable: true })
  locked?: boolean | null;

  @Field(() => PuckBlockVisibility, { nullable: true })
  visibility?: PuckBlockVisibility | null;

  @Field(() => PuckBlockStyling, { nullable: true })
  styling?: PuckBlockStyling | null;

  @Field(() => PuckBlockDatasources, { nullable: true })
  datasources?: PuckBlockDatasources | null;

  @Field(() => String, {
    nullable: true,
    description:
      'The slot path inside the parent data, like `items[2].content`. Omitted means `content`.',
  })
  slot?: string | null;

  @Field(() => [PuckBlockInput], { nullable: true })
  children?: PuckBlockInput[] | null;
}
