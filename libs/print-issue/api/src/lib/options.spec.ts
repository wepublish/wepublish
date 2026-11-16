import { DEFAULT_OPTIONS, optionsFrom, sameOptions } from './options';

describe('bexio kinds in the options', () => {
  it('reads every kind when a stored value predates the kinds', () => {
    expect(
      optionsFrom({
        memberPlanIds: null,
        includeBexio: true,
        includeOpen: true,
        includeUpcoming: false,
      }).bexioKindIds
    ).toBeNull();
    expect(DEFAULT_OPTIONS.bexioKindIds).toBeNull();
  });

  it('keeps a choice of kinds, once each; an empty choice means every kind', () => {
    expect(
      optionsFrom({ bexioKindIds: ['gift', 'single', 'gift'] }).bexioKindIds
    ).toEqual(['gift', 'single']);
    expect(optionsFrom({ bexioKindIds: [] }).bexioKindIds).toBeNull();
    expect(optionsFrom({ bexioKindIds: null }).bexioKindIds).toBeNull();
  });

  it('refuses anything but a list of ids', () => {
    expect(() => optionsFrom({ bexioKindIds: 'gift' })).toThrow(/bexioKindIds/);
    expect(() => optionsFrom({ bexioKindIds: [1] })).toThrow(/bexioKindIds/);
  });

  it('compares kinds regardless of their order', () => {
    const base = optionsFrom({});

    expect(
      sameOptions(
        { ...base, bexioKindIds: ['gift', 'broker'] },
        { ...base, bexioKindIds: ['broker', 'gift'] }
      )
    ).toBe(true);
    expect(
      sameOptions(
        { ...base, bexioKindIds: ['gift'] },
        { ...base, bexioKindIds: null }
      )
    ).toBe(false);
  });
});
