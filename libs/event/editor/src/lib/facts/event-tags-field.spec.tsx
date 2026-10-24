import { useApolloClient, useQuery } from '@apollo/client/react';
import { fireEvent, screen, within } from '@testing-library/react';
import { TagListDocument, TagType } from '@wepublish/editor/api';
import type { Mock } from 'vitest';

import { renderInForm } from '../test-helpers';
import { EventTagsField } from './event-tags-field';

vi.mock('react-i18next', async () =>
  (await import('../event-list/test-translate')).i18nMock()
);

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useApolloClient: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const TAGS = ['Konzert', 'Theater', 'Tanz', 'Kunst'].map((tag, index) => ({
  __typename: 'Tag',
  id: `tag-${index + 1}`,
  tag,
  type: TagType.Event,
}));

beforeEach(() => {
  (useApolloClient as unknown as Mock).mockReturnValue({
    query: vi.fn().mockResolvedValue({ data: {} }),
  });
  mockedUseQuery.mockReset().mockImplementation(document =>
    document === TagListDocument ?
      {
        data: { tags: { nodes: TAGS, totalCount: TAGS.length } },
        refetch: vi.fn(),
      }
    : { data: undefined }
  );
});

describe('EventTagsField', () => {
  it('lists event tags only', () => {
    renderInForm(<EventTagsField defaultTags={[]} />);

    expect(mockedUseQuery).toHaveBeenCalledWith(
      TagListDocument,
      expect.objectContaining({
        variables: expect.objectContaining({
          filter: { type: TagType.Event },
        }),
      })
    );
  });

  it('refuses a fourth tag and says why', () => {
    renderInForm(<EventTagsField defaultTags={TAGS} />, {
      defaultValues: { tagIds: ['tag-1', 'tag-2', 'tag-3'] },
    });

    expect(screen.getByText('agenda.form.tagsAtMax 3')).toBeInTheDocument();

    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: 'agenda.form.tags' })
    );

    const listbox = screen.getByRole('listbox');

    expect(
      within(listbox).getByRole('option', { name: 'Kunst' })
    ).toHaveAttribute('aria-disabled', 'true');
  });

  it('asks for at least one tag on submit', async () => {
    renderInForm(<EventTagsField defaultTags={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'submit' }));

    expect(
      await screen.findByText('agenda.form.errors.tagsRequired 1')
    ).toBeInTheDocument();
  });
});
