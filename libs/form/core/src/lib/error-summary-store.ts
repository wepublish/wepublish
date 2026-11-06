export type ErrorSummaryStore = {
  mount: () => () => void;
  isMounted: () => boolean;
};

export function createErrorSummaryStore(): ErrorSummaryStore {
  let mounted = 0;

  return {
    mount: () => {
      mounted++;

      return () => {
        mounted--;
      };
    },
    isMounted: () => mounted > 0,
  };
}
