import { createErrorSummaryStore } from './error-summary-store';

describe('createErrorSummaryStore', () => {
  it('knows whether a summary is mounted', () => {
    const store = createErrorSummaryStore();

    expect(store.isMounted()).toBe(false);

    const unmountFirst = store.mount();
    const unmountSecond = store.mount();

    unmountFirst();

    expect(store.isMounted()).toBe(true);

    unmountSecond();

    expect(store.isMounted()).toBe(false);
  });
});
