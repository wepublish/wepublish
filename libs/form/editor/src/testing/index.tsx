import {
  MockedProvider,
  type MockedProviderProps,
} from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import {
  render,
  screen,
  waitFor,
  within,
  type RenderResult,
} from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { closeSnackbar, SnackbarHost } from '@wepublish/ui/editor';
import type { ComponentType, ReactElement, ReactNode } from 'react';
import {
  createMemoryRouter,
  Route,
  RouterProvider,
  Routes,
  useLocation,
  useRouteError,
} from 'react-router-dom';

export * from './autocomplete';
export * from './picker-mocks';

export type RenderEditorFormOptions = {
  mocks?: MockedProviderProps['mocks'];
  route?: string;
  path?: string;
};

export type RenderEditorFormResult = RenderResult & { user: UserEvent };

const theme = createTheme({
  cssVariables: true,
  transitions: { create: () => 'none' },
  components: {
    MuiDrawer: { defaultProps: { transitionDuration: 0 } },
  },
});

export const getFieldByLabel = (label: string | RegExp) =>
  screen.getByLabelText<HTMLInputElement>(label, {
    selector: 'input, textarea',
  });

export const queryFieldByLabel = (label: string | RegExp) =>
  screen.queryByLabelText<HTMLInputElement>(label, {
    selector: 'input, textarea',
  });

export const drawerClosed = (options?: { timeout?: number }) =>
  waitFor(
    () =>
      expect(document.querySelector('.MuiDrawer-root')).not.toBeInTheDocument(),
    options
  );

function Rethrow(): ReactNode {
  throw useRouteError();
}

export function renderEditorForm(
  ui: ReactElement,
  { mocks = [], route = '/', path }: RenderEditorFormOptions = {}
): RenderEditorFormResult {
  closeSnackbar();

  const user = userEvent.setup();
  const router = createMemoryRouter(
    [
      {
        path: '*',
        element: (
          <>
            {path === undefined ?
              ui
            : <Routes>
                <Route
                  path={path}
                  element={ui}
                />
              </Routes>
            }
            <SnackbarHost />
          </>
        ),
        errorElement: <Rethrow />,
      },
    ],
    { initialEntries: [route] }
  );
  const result = render(
    <ThemeProvider theme={theme}>
      <MockedProvider mocks={mocks}>
        <RouterProvider router={router} />
      </MockedProvider>
    </ThemeProvider>
  );

  return { ...result, user };
}

export type RenderFormRoutesOptions = {
  readonly route: string;
  readonly mocks?: MockedProviderProps['mocks'];
  readonly wrapper?: ComponentType<{ children: ReactNode }>;
};

export type RenderFormRoutesResult = RenderEditorFormResult & {
  readonly currentPath: () => string;
};

function CurrentPath() {
  const { pathname } = useLocation();

  return (
    <output
      data-testid="current-path"
      hidden
    >
      {pathname}
    </output>
  );
}

function Unwrapped({ children }: { children: ReactNode }) {
  return children;
}

export function renderFormRoutes(
  routes: Readonly<Record<string, ReactElement>>,
  { route, mocks, wrapper: Wrapper = Unwrapped }: RenderFormRoutesOptions
): RenderFormRoutesResult {
  const result = renderEditorForm(
    <Wrapper>
      <Routes>
        {Object.entries(routes).map(([path, element]) => (
          <Route
            key={path}
            path={path}
            element={element}
          />
        ))}
        <Route
          path="*"
          element={null}
        />
      </Routes>
      <CurrentPath />
    </Wrapper>,
    { mocks, route }
  );

  return {
    ...result,
    currentPath: () => screen.getByTestId('current-path').textContent ?? '',
  };
}

export const formSectionOf = (title: string | RegExp) =>
  within(screen.getByRole('region', { name: title }));

export const formHeader = () => within(screen.getByTestId('formHeader'));
