import { createContext } from 'react';

export type BuilderRouterNavigateOptions = { replace?: boolean };

export type BuilderRouterNavigate = (
  href: string,
  options?: BuilderRouterNavigateOptions
) => Promise<unknown> | void;

export type BuilderRouter = {
  query: Record<string, string | string[] | undefined>;
  asPath: string;
  navigate?: BuilderRouterNavigate;
};

export const BuilderRouterContext = createContext<BuilderRouter>({
  query: {},
  asPath: '',
});
