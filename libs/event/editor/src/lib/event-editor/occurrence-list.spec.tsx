import { useQuery } from '@apollo/client/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { EditorEventOccurrencesDocument } from '@wepublish/editor/api';
import type { Mock } from 'vitest';

import { renderWith } from '../event-list/test-helpers';
import { OCCURRENCE_PAGE_SIZE, OccurrenceList } from './occurrence-list';

vi.mock('react-i18next', async () =>
  (await import('../event-list/test-translate')).i18nMock()
);

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const occurrence = (index: number) => ({
  __typename: 'Occurrence',
  id: `occ-${index}`,
  dateFrom: new Date(Date.UTC(2027, 0, 1 + index, 19)).toISOString(),
  dateTo: new Date(Date.UTC(2027, 0, 1 + index, 21)).toISOString(),
  openingTime: null,
});

const lastVariables = () => mockedUseQuery.mock.calls.at(-1)?.[1]?.variables;

beforeEach(() => {
  mockedUseQuery.mockReset().mockImplementation(() => ({
    data: {
      agenda: {
        nodes: Array.from({ length: OCCURRENCE_PAGE_SIZE }, (_, index) =>
          occurrence(index)
        ),
        totalCount: 12374,
      },
    },
    loading: false,
  }));
});

describe('OccurrenceList', () => {
  it('asks for one page of 20 upcoming dates of this event', () => {
    render(renderWith(<OccurrenceList eventId="event-1" />));

    const [document, options] = mockedUseQuery.mock.calls.at(-1)!;

    expect(OCCURRENCE_PAGE_SIZE).toBe(20);
    expect(document).toBe(EditorEventOccurrencesDocument);
    expect(options.variables).toEqual({ id: 'event-1', take: 20, skip: 0 });
  });

  it('shows the total and only the page it loaded', () => {
    render(renderWith(<OccurrenceList eventId="event-1" />));

    expect(
      screen.getByText('agenda.editor.occurrences.title 12374')
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(20);
  });

  it('pages through the dates', () => {
    render(renderWith(<OccurrenceList eventId="event-1" />));

    fireEvent.click(screen.getByRole('button', { name: /next page/i }));

    expect(lastVariables()).toEqual({ id: 'event-1', take: 20, skip: 20 });
  });

  it('says so when no date lies ahead', () => {
    mockedUseQuery.mockReturnValue({
      data: { agenda: { nodes: [], totalCount: 0 } },
      loading: false,
    });

    render(renderWith(<OccurrenceList eventId="event-1" />));

    expect(
      screen.getByText('agenda.editor.occurrences.none')
    ).toBeInTheDocument();
  });
});
