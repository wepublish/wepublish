import { useBuilderRouterEvent } from './use-builder-router-event';

export const useCloseOnNavigation = (close: () => void) => {
  useBuilderRouterEvent('navigationStart', close);
  useBuilderRouterEvent('hashChangeStart', close);
};
