/**
 * Helpers for specs that stub Apollo hooks by operation name. Use them from a
 * `vi.mock` factory through a dynamic import, as the factory is hoisted above
 * the imports of the spec.
 */

import { createTheme, ThemeProvider } from '@mui/material';
import { render } from '@testing-library/react';
import { ReactElement } from 'react';

type AnyFunction = (...args: never[]) => unknown;

export const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value;

type ApolloRoutes = {
  queries?: Record<string, (options?: unknown) => unknown>;
  mutations?: Record<string, (options?: unknown) => unknown>;
};

export function routeApolloByOperation(
  actual: Record<string, unknown>,
  { queries = {}, mutations = {} }: ApolloRoutes
) {
  return {
    ...actual,
    useQuery: (document: unknown, options?: unknown) => {
      const query = queries[operationName(document) ?? ''];

      return query ?
          query(options)
        : (actual['useQuery'] as AnyFunction)(
            ...([document, options] as never[])
          );
    },
    useMutation: (document: unknown, options?: unknown) =>
      mutations[operationName(document) ?? '']?.(options) ?? [
        () => undefined,
        {},
      ],
  };
}

export const translationMock = {
  useTranslation: () => ({
    t: (key: string, options?: { name?: string }) =>
      options?.name ? `${key}:${options.name}` : key,
    i18n: { language: 'en' },
  }),
  Trans: ({ children }: { children?: unknown }) => children,
  initReactI18next: { type: '3rdParty', init: () => undefined },
};

const theme = createTheme({ cssVariables: true });

export const renderWithTheme = (ui: ReactElement) =>
  render(ui, {
    wrapper: ({ children }) => (
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    ),
  });
