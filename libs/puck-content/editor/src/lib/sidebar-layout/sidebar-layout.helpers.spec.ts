import {
  CompactSidebars,
  isCompactSidebarWidth,
  nextCompactSidebars,
} from './sidebar-layout.helpers';

const state = (
  left: boolean,
  right: boolean,
  restoreRight = false
): CompactSidebars => ({ left, right, restoreRight });

describe('isCompactSidebarWidth', () => {
  it('leaves phones to the mobile layout of puck', () => {
    expect(isCompactSidebarWidth(637)).toBe(false);
  });

  it('is compact from the desktop layout up to a landscape tablet', () => {
    expect(isCompactSidebarWidth(638)).toBe(true);
    expect(isCompactSidebarWidth(1023)).toBe(true);
  });

  it('fits both sidebars from 1024px on', () => {
    expect(isCompactSidebarWidth(1024)).toBe(false);
  });
});

describe('nextCompactSidebars', () => {
  it('hides the fields while the left sidebar is opened', () => {
    expect(
      nextCompactSidebars(state(false, true), { left: true, right: true })
    ).toEqual(state(true, false, true));
  });

  it('hides the left sidebar when the fields are opened', () => {
    expect(
      nextCompactSidebars(state(true, false), { left: true, right: true })
    ).toEqual(state(false, true));
  });

  it('keeps the fields when both sidebars were already open', () => {
    expect(
      nextCompactSidebars(state(true, true), { left: true, right: true })
    ).toEqual(state(false, true));
  });

  it('brings the fields back when the left sidebar that hid them closes', () => {
    expect(
      nextCompactSidebars(state(true, false, true), {
        left: false,
        right: false,
      })
    ).toEqual(state(false, true));
  });

  it('leaves both closed when the fields were closed by hand before', () => {
    expect(
      nextCompactSidebars(state(true, false), { left: false, right: false })
    ).toEqual(state(false, false));
  });

  it('remembers the hidden fields while switching left panels', () => {
    expect(
      nextCompactSidebars(state(true, false, true), {
        left: true,
        right: false,
      })
    ).toEqual(state(true, false, true));
  });

  it('forgets the hidden fields once they are shown again', () => {
    expect(
      nextCompactSidebars(state(false, false, true), {
        left: false,
        right: true,
      })
    ).toEqual(state(false, true));
  });

  it('accepts a single open sidebar as it is', () => {
    expect(
      nextCompactSidebars(state(false, false), { left: false, right: true })
    ).toEqual(state(false, true));
    expect(
      nextCompactSidebars(state(false, false), { left: true, right: false })
    ).toEqual(state(true, false));
  });
});
