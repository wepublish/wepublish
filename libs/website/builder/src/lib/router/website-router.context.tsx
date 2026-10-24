import { createContext } from 'react';

export const BuilderRouterContext = createContext<{
  query: Record<string, string | string[] | undefined>;
  replaceQuery?: (query: Record<string, string | undefined>) => void;
}>({
  query: {},
});
