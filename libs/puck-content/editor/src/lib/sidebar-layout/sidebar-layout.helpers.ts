export type Sidebars = { left: boolean; right: boolean };

export type CompactSidebars = Sidebars & { restoreRight: boolean };

export const PUCK_MOBILE_LAYOUT_WIDTH = 638;
export const BOTH_SIDEBARS_MIN_WIDTH = 1024;

export const compactSidebarQuery = `(min-width: ${PUCK_MOBILE_LAYOUT_WIDTH}px) and (max-width: ${BOTH_SIDEBARS_MIN_WIDTH - 0.02}px)`;

export const isCompactSidebarWidth = (width: number) =>
  width >= PUCK_MOBILE_LAYOUT_WIDTH && width < BOTH_SIDEBARS_MIN_WIDTH;

export const nextCompactSidebars = (
  previous: CompactSidebars,
  current: Sidebars
): CompactSidebars => {
  if (current.left && current.right) {
    return previous.left ?
        { left: false, right: true, restoreRight: false }
      : { left: true, right: false, restoreRight: true };
  }

  if (
    previous.left &&
    previous.restoreRight &&
    !current.left &&
    !current.right
  ) {
    return { left: false, right: true, restoreRight: false };
  }

  return {
    ...current,
    restoreRight: previous.restoreRight && current.left && !current.right,
  };
};
