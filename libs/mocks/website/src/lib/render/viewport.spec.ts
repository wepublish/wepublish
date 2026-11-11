import { DEFAULT_TEST_VIEWPORT_WIDTH, setTestViewportWidth } from './viewport';

describe('setTestViewportWidth', () => {
  it('resizes the window so media queries follow', () => {
    setTestViewportWidth(400);

    expect(window.innerWidth).toBe(400);
    expect(window.matchMedia('(min-width: 900px)').matches).toBe(false);
  });

  it('starts every test at the default desktop width', () => {
    expect(window.innerWidth).toBe(DEFAULT_TEST_VIEWPORT_WIDTH);
    expect(window.matchMedia('(min-width: 900px)').matches).toBe(true);
  });
});
