import { GraphQLScalarType, Kind, ValueNode } from 'graphql';
import { z } from 'zod';

import {
  puckBackgroundPositionSchema,
  puckMaxWidthSchema,
  puckMinHeightSchema,
  puckSpacingSchema,
} from './puck-blocks';

const literalValue = (ast: ValueNode): unknown => {
  switch (ast.kind) {
    case Kind.INT:
    case Kind.FLOAT:
      return Number(ast.value);
    case Kind.STRING:
      return ast.value;
    default:
      return undefined;
  }
};

const puckScalar = <Schema extends z.ZodTypeAny>(
  name: string,
  description: string,
  schema: Schema
) => {
  type Value = z.output<Schema>;

  const parse = (value: unknown): Value => {
    const result = schema.safeParse(value);

    if (!result.success) {
      throw new TypeError(
        `${name} ${result.error.issues[0].message}, got ${JSON.stringify(value)}`
      );
    }

    return result.data;
  };

  return new GraphQLScalarType<Value, Value>({
    name,
    description,
    serialize: parse,
    parseValue: parse,
    parseLiteral: ast => parse(literalValue(ast)),
  });
};

export const PuckSpacingScalar = puckScalar(
  'PuckSpacing',
  'A number of theme spacing units like `2`, or exact pixels as a string like `"12px"`.',
  puckSpacingSchema
);

export const PuckMinHeightScalar = puckScalar(
  'PuckMinHeight',
  'A minimum height in pixels like `"320px"` or in percent of the viewport height like `"50vh"`.',
  puckMinHeightSchema
);

export const PuckMaxWidthScalar = puckScalar(
  'PuckMaxWidth',
  'A maximum width: a theme breakpoint (`"sm"`, `"md"`, `"lg"`, `"xl"`), pixels like `"640px"` or percent like `"80%"`.',
  puckMaxWidthSchema
);

export const PuckBackgroundPositionScalar = puckScalar(
  'PuckBackgroundPosition',
  'Anchor point of a background image as `"<x> <y>"`, x one of left, center, right and y one of top, center, bottom.',
  puckBackgroundPositionSchema
);
