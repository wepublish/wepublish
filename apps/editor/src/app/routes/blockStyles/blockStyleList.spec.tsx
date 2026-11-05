import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { BlockStyleList } from './blockStyleList';

const queryResult = vi.hoisted(() => ({
  loading: false,
  data: {
    blockStyles: [
      {
        __typename: 'BlockStyle',
        id: 'style-1',
        name: 'Slider',
        blocks: ['teaserGrid'],
      },
    ],
  },
}));

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: () => queryResult,
  useMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  createCheckedPermissionComponent: () => (component: unknown) => component,
  PermissionControl: ({ children }: { children: unknown }) => children,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('BlockStyleList', () => {
  it('keeps the style name and block types labelled once values are filled in', () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <MemoryRouter>
          <BlockStyleList />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(
      screen.getByRole('textbox', { name: 'blockStyles.placeholder' })
    ).toBeTruthy();
    expect(
      screen.getByRole('combobox', {
        name: 'blockStyles.blockTypesPlaceholder',
      })
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'delete Slider' })).toBeTruthy();
  });
});
