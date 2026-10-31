import {
  addToImageSelection,
  canAddToImageSelection,
  toggleImageSelection,
} from './imageSelection';

describe('toggleImageSelection', () => {
  it('adds an image at the end', () => {
    expect(toggleImageSelection(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('removes an image that is already selected', () => {
    expect(toggleImageSelection(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });

  it('adds nothing once the maximum is reached', () => {
    expect(toggleImageSelection(['a', 'b'], 'c', 2)).toEqual(['a', 'b']);
  });

  it('still removes an image at the maximum', () => {
    expect(toggleImageSelection(['a', 'b'], 'a', 2)).toEqual(['b']);
  });
});

describe('addToImageSelection', () => {
  it('appends an image that is not selected yet', () => {
    expect(addToImageSelection(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('keeps an image that is already selected where it is', () => {
    expect(addToImageSelection(['a', 'b'], 'a')).toEqual(['a', 'b']);
  });

  it('adds nothing once the maximum is reached', () => {
    expect(addToImageSelection(['a'], 'b', 1)).toEqual(['a']);
  });
});

describe('canAddToImageSelection', () => {
  it('allows any number without a maximum', () => {
    expect(canAddToImageSelection(['a', 'b', 'c'])).toBe(true);
  });

  it('allows adding until the maximum is reached', () => {
    expect(canAddToImageSelection(['a'], 2)).toBe(true);
    expect(canAddToImageSelection(['a', 'b'], 2)).toBe(false);
  });
});
