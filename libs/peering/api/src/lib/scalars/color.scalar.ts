import { GraphQLScalarType, Kind } from 'graphql';

const ColorRegexp = /^#[A-Fa-f0-9]{6}$/;

const validateColor = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error('Color must be a string');
  }

  if (!value.match(ColorRegexp)) {
    throw new Error('Invalid hex color string. Format must be #RRGGBB');
  }

  return value;
};

// Define the PeerColor scalar
export const ColorScalar = new GraphQLScalarType({
  name: 'Color',
  description: 'A hexadecimal color value (#RRGGBB)',

  // For outgoing values (serialization)
  serialize: value => validateColor(value),

  // For incoming values from variables
  parseValue: value => validateColor(value),

  // For incoming values from inline literals in queries
  parseLiteral: ast => {
    if (ast.kind !== Kind.STRING) {
      throw new Error('Color must be a string');
    }
    return validateColor(ast.value);
  },
});
