import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import {
  FullTagFragment,
  TagDocument,
  TagListDocument,
  TagListQuery,
  TagQuery,
  TagType,
} from '@wepublish/editor/api';

import { SelectTags } from './selectTags';

const theme = createTheme({ cssVariables: true });

const archived: FullTagFragment = {
  __typename: 'Tag',
  id: 'tag-archived',
  tag: 'Archiv',
  description: null,
  type: TagType.Event,
  main: false,
  url: 'https://example.com/tag/tag-archived',
  color: null,
};

const emptyList: TagListQuery = {
  __typename: 'Query',
  tags: {
    __typename: 'PaginatedTags',
    nodes: [],
    pageInfo: {
      __typename: 'PageInfo',
      startCursor: null,
      endCursor: null,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    totalCount: 0,
  },
};

const archivedTag: TagQuery = { __typename: 'Query', tag: archived };

const mocks = [
  {
    request: { query: TagListDocument, variables: () => true },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: { data: emptyList },
  },
  {
    request: { query: TagDocument, variables: { id: 'tag-archived' } },
    maxUsageCount: Number.POSITIVE_INFINITY,
    delay: 50,
    result: { data: archivedTag },
  },
];

const picker = (
  selectedTags: string[],
  props: { label?: string; 'aria-labelledby'?: string } = {}
) => (
  <ThemeProvider theme={theme}>
    <span id="tags-label">Event tags</span>
    <MockedProvider mocks={mocks}>
      <SelectTags
        {...props}
        tagType={TagType.Event}
        defaultTags={[]}
        selectedTags={selectedTags}
        setSelectedTags={vi.fn()}
      />
    </MockedProvider>
  </ThemeProvider>
);

describe('SelectTags', () => {
  it('names its input with the label it is given', () => {
    render(picker([], { label: 'Tags' }));

    expect(screen.getByRole('combobox', { name: 'Tags' })).toBeTruthy();
  });

  it('can be named by a label rendered elsewhere', () => {
    render(picker([], { 'aria-labelledby': 'tags-label' }));

    expect(screen.getByRole('combobox', { name: 'Event tags' })).toBeTruthy();
  });

  it('names a selected tag it has not loaded', async () => {
    render(picker(['tag-archived']));

    expect(await screen.findByText('Archiv')).toBeInTheDocument();
  });

  it('still names it when it re-renders while the name is loading', async () => {
    const { rerender } = render(picker(['tag-archived']));

    rerender(picker(['tag-archived']));

    expect(await screen.findByText('Archiv')).toBeInTheDocument();
  });
});
