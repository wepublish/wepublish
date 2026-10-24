import { BadRequestException } from '@nestjs/common';
import { assertValidLocation, MAX_ZIP_LENGTH } from './location-rules';

describe('assertValidLocation', () => {
  it('accepts a full location and an empty one', () => {
    expect(() =>
      assertValidLocation({ zip: '3005', latitude: 46.9, longitude: 7.4 })
    ).not.toThrow();
    expect(() => assertValidLocation({})).not.toThrow();
  });

  it('accepts a zip of four characters and rejects five', () => {
    expect(MAX_ZIP_LENGTH).toBe(4);
    expect(() => assertValidLocation({ zip: '3005' })).not.toThrow();
    expect(() => assertValidLocation({ zip: '30050' })).toThrow(
      BadRequestException
    );
  });

  it.each([
    [{ latitude: 46.9, longitude: null }],
    [{ latitude: undefined, longitude: 7.4 }],
  ])('rejects one coordinate without the other: %o', location => {
    expect(() => assertValidLocation(location)).toThrow(
      'Latitude and longitude must be given together.'
    );
  });

  it('accepts a coordinate of zero', () => {
    expect(() =>
      assertValidLocation({ latitude: 0, longitude: 0 })
    ).not.toThrow();
  });
});
