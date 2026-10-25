import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { TagType } from '@wepublish/editor/api';

import { SelectTags } from './selectTags';

vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({ data: undefined, refetch: vi.fn() }),
  useApolloClient: () => ({ query: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const theme = createTheme({ cssVariables: true });

describe('SelectTags', () => {
  it('names its input with the label it is given', () => {
    render(
      <ThemeProvider theme={theme}>
        <SelectTags
          label="Tags"
          tagType={TagType.Article}
          defaultTags={[]}
          setSelectedTags={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.getByRole('combobox', { name: 'Tags' })).toBeTruthy();
  });

  it('can be named by a label rendered elsewhere', () => {
    render(
      <ThemeProvider theme={theme}>
        <span id="tags-label">Article tags</span>
        <SelectTags
          aria-labelledby="tags-label"
          tagType={TagType.Article}
          defaultTags={[]}
          setSelectedTags={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(screen.getByRole('combobox', { name: 'Article tags' })).toBeTruthy();
  });
});
