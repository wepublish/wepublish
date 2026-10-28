type ViewportWindow = Window & {
  happyDOM?: { setViewport: (viewport: { width?: number }) => void };
};

export const DEFAULT_TEST_VIEWPORT_WIDTH = 1024;

export const setTestViewportWidth = (width: number) => {
  if (typeof window === 'undefined') {
    return;
  }

  (window as ViewportWindow).happyDOM?.setViewport({ width });
};
