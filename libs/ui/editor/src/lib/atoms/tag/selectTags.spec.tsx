import { useApolloClient, useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { TagType } from '@wepublish/editor/api';
import type { Mock } from 'vitest';

import { SelectTags } from './selectTags';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useApolloClient: vi.fn(),
}));

const TAGS = ['Konzert', 'Theater', 'Tanz'].map((tag, index) => ({
  __typename: 'Tag',
  id: `tag-${index + 1}`,
  tag,
}));

beforeEach(() => {
  (useApolloClient as unknown as Mock).mockReturnValue({
    query: vi.fn().mockResolvedValue({ data: {} }),
  });
  (useQuery as unknown as Mock).mockReturnValue({
    data: { tags: { nodes: TAGS, totalCount: TAGS.length } },
    refetch: vi.fn(),
  });
});

const renderTags = (selected: string[]) =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <SelectTags
        tagType={TagType.Event}
        defaultTags={TAGS}
        selectedTags={selected}
        setSelectedTags={vi.fn()}
        label="Tags"
        helperText="Pick up to two"
        maxTags={2}
      />
    </ThemeProvider>
  );

describe('SelectTags', () => {
  it('shows its label and helper text', () => {
    renderTags([]);

    expect(screen.getByRole('combobox', { name: 'Tags' })).toBeInTheDocument();
    expect(screen.getByText('Pick up to two')).toBeInTheDocument();
  });

  it('disables the unpicked tags once maxTags are picked', () => {
    renderTags(['tag-1', 'tag-2']);

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Tags' }));

    const listbox = screen.getByRole('listbox');

    expect(
      within(listbox).getByRole('option', { name: 'Tanz' })
    ).toHaveAttribute('aria-disabled', 'true');
    expect(
      within(listbox).getByRole('option', { name: 'Konzert' })
    ).not.toHaveAttribute('aria-disabled', 'true');
  });
});
