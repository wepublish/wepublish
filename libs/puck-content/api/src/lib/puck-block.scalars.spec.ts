import { GraphQLScalarType, Kind, parseValue } from 'graphql';

import {
  PuckBackgroundPositionScalar,
  PuckMaxWidthScalar,
  PuckMinHeightScalar,
  PuckSpacingScalar,
} from './puck-block.scalars';

const scalars: [GraphQLScalarType, unknown[], unknown[]][] = [
  [
    PuckSpacingScalar,
    [0, 2, 1.5, '0px', '12px', '12.5px'],
    [-1, '1rem', '12', true],
  ],
  [PuckMinHeightScalar, ['320px', '50vh', '12.5vh'], ['50%', '320', 320, 'md']],
  [PuckMaxWidthScalar, ['sm', 'xl', '640px', '80%'], ['xs', '50vh', 640, '']],
  [
    PuckBackgroundPositionScalar,
    ['left top', 'center center', 'right bottom'],
    ['top left', 'center', 1],
  ],
];

describe.each(scalars)('%s', (scalar, valid, invalid) => {
  it.each(valid)('passes %j through in both directions', value => {
    expect(scalar.parseValue(value)).toBe(value);
    expect(scalar.serialize(value)).toBe(value);
  });

  it.each(invalid)('refuses %j', value => {
    expect(() => scalar.parseValue(value)).toThrow(scalar.name);
    expect(() => scalar.serialize(value)).toThrow(scalar.name);
  });
});

describe('PuckSpacingScalar literals', () => {
  it.each([
    ['2', 2],
    ['1.5', 1.5],
    ['"12px"', '12px'],
  ])('reads %s', (literal, value) => {
    expect(PuckSpacingScalar.parseLiteral(parseValue(literal))).toBe(value);
  });

  it('refuses a literal of another kind', () => {
    expect(() =>
      PuckSpacingScalar.parseLiteral({ kind: Kind.BOOLEAN, value: true })
    ).toThrow('PuckSpacing');
  });
});

describe('PuckMaxWidthScalar literals', () => {
  it('reads a string', () => {
    expect(PuckMaxWidthScalar.parseLiteral(parseValue('"md"'))).toBe('md');
  });

  it('refuses an enum value', () => {
    expect(() => PuckMaxWidthScalar.parseLiteral(parseValue('md'))).toThrow(
      'PuckMaxWidth'
    );
  });
});
