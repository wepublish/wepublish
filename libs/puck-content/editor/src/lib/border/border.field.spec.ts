import { Side } from '../sides/sides';
import { BorderValue, toBorderWidth } from './border.field';

describe('border width', () => {
  it('is stored in pixels per side', () => {
    expectTypeOf<NonNullable<BorderValue['width']>>().toEqualTypeOf<
      Partial<Record<Side, number>>
    >();
  });

  it('keeps the pixel numbers the sides input reports', () => {
    expect(toBorderWidth({ top: 2, right: 0, bottom: 1.5 })).toEqual({
      top: 2,
      right: 0,
      bottom: 1.5,
    });
  });

  it('turns pixel strings into numbers', () => {
    expect(toBorderWidth({ top: '3px', left: '0.5px' })).toEqual({
      top: 3,
      left: 0.5,
    });
  });

  it('leaves out the sides without a width', () => {
    expect(toBorderWidth({ top: undefined, right: 4 })).toEqual({ right: 4 });
    expect(toBorderWidth({})).toEqual({});
  });
});
