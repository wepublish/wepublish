import { createContext } from 'react';

export const BuilderRouterContext = createContext<{
  query: Record<string, string | string[] | undefined>;
}>({
  query: {},
});
