import { useApolloClient, useMutation } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { TagEditView } from './tagEditView';

const theme = createTheme({ cssVariables: true });

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useMutation: vi.fn(),
  useApolloClient: vi.fn(),
  useQuery: () => ({ data: undefined, loading: false }),
}));

vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useParams: () => ({ id: 'tag-1' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(',')}` : key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  RichTextBlock: ({ onChange }: { onChange?: (value: unknown) => void }) => (
    <button
      type="button"
      data-testid="rich-text"
      onClick={() => onChange?.([])}
    />
  ),
}));

const mockedUseMutation = useMutation as unknown as Mock;
const mockedUseApolloClient = useApolloClient as unknown as Mock;
const updateTag = vi.fn();
const query = vi.fn();

const renderView = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <TagEditView />
      </MemoryRouter>
    </ThemeProvider>
  );

beforeEach(() => {
  updateTag.mockReset();
  mockedUseMutation.mockReset();
  mockedUseMutation.mockReturnValue([updateTag, { loading: false }]);

  query.mockReset();
  query.mockResolvedValue({
    data: {
      tag: {
        id: 'tag-1',
        tag: 'Sport',
        color: '#0e5c56',
        description: null,
        main: true,
      },
    },
  });
  mockedUseApolloClient.mockReturnValue({ query });
});

describe('TagEditView', () => {
  it('opens on the tag it was asked for', async () => {
    renderView();

    expect(await screen.findByDisplayValue('Sport')).toBeInTheDocument();
    expect(screen.getByDisplayValue('#0e5c56')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('saves what was edited', async () => {
    renderView();

    fireEvent.change(await screen.findByDisplayValue('Sport'), {
      target: { value: 'Sports' },
    });
    fireEvent.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(updateTag).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({ id: 'tag-1', tag: 'Sports' }),
        })
      )
    );
  });

  it('asks for the tag once', async () => {
    renderView();

    await screen.findByDisplayValue('Sport');

    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: 'tag-1' } })
    );
  });
});
