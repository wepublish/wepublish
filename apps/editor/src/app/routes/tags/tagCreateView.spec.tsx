import { useMutation } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TagType } from '@wepublish/editor/api';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { TagCreateView } from './tagCreateView';

const theme = createTheme({ cssVariables: true });

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useMutation: vi.fn(),
  useQuery: () => ({ data: undefined, loading: false }),
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
const createTag = vi.fn();

const renderView = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <TagCreateView type={TagType.Article} />
      </MemoryRouter>
    </ThemeProvider>
  );

beforeEach(() => {
  createTag.mockReset();
  mockedUseMutation.mockReset();
  mockedUseMutation.mockReturnValue([createTag, { loading: false }]);
});

describe('TagCreateView', () => {
  it('will not create a tag without a name', async () => {
    renderView();

    fireEvent.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(createTag).not.toHaveBeenCalled());
  });

  it('creates the tag once it has a name', async () => {
    renderView();

    fireEvent.change(screen.getByLabelText('tags.overview.name'), {
      target: { value: 'Politics' },
    });
    fireEvent.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(createTag).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            tag: 'Politics',
            type: TagType.Article,
          }),
        })
      )
    );
  });

  it('carries the main flag through', async () => {
    renderView();

    fireEvent.change(screen.getByLabelText('tags.overview.name'), {
      target: { value: 'Politics' },
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(createTag).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({ main: true }),
        })
      )
    );
  });
});
