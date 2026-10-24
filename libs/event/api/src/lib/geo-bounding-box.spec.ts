import { BadRequestException } from '@nestjs/common';
import { geoBoundingBoxWhere } from './geo-bounding-box';

describe('geoBoundingBoxWhere', () => {
  it('limits latitude and longitude to the box', () => {
    expect(
      geoBoundingBoxWhere({
        southWest: { latitude: 46.9, longitude: 7.3 },
        northEast: { latitude: 47.0, longitude: 7.5 },
      })
    ).toEqual({
      latitude: { gte: 46.9, lte: 47.0 },
      longitude: { gte: 7.3, lte: 7.5 },
    });
  });

  it('adds nothing without a box', () => {
    expect(geoBoundingBoxWhere(null)).toEqual({});
    expect(geoBoundingBoxWhere(undefined)).toEqual({});
  });

  it.each([
    [{ southWest: { latitude: 46.9, longitude: 7.3 } }],
    [{ northEast: { latitude: 47.0, longitude: 7.5 } }],
  ])('rejects a box with only one corner: %o', box => {
    expect(() => geoBoundingBoxWhere(box as any)).toThrow(BadRequestException);
  });

  it.each([
    [
      'south of north',
      { latitude: 47.1, longitude: 7.3 },
      { latitude: 47.0, longitude: 7.5 },
    ],
    [
      'west of east',
      { latitude: 46.9, longitude: 7.6 },
      { latitude: 47.0, longitude: 7.5 },
    ],
  ])(
    'rejects a box whose corners are swapped (%s)',
    (_, southWest, northEast) => {
      expect(() => geoBoundingBoxWhere({ southWest, northEast })).toThrow(
        BadRequestException
      );
    }
  );

  it('accepts a box of a single point', () => {
    const point = { latitude: 46.9, longitude: 7.4 };

    expect(geoBoundingBoxWhere({ southWest: point, northEast: point })).toEqual(
      {
        latitude: { gte: 46.9, lte: 46.9 },
        longitude: { gte: 7.4, lte: 7.4 },
      }
    );
  });
});
