import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  CreateEventDocument,
  DuplicateEventDocument,
  EditorEventDocument,
  EditorEventFragment,
  EditorEventOccurrencesDocument,
  EventStatus,
  PublishEventDocument,
  RequestEventReviewDocument,
  TagListDocument,
  TagType,
  UpdateEventContentDocument,
  UpdateEventDocument,
  UpdateEventImageAltTextDocument,
} from '@wepublish/editor/api';
import {
  CanCreateEvent,
  CanGetEvent,
  CanPublishEvent,
  CanUpdateEvent,
} from '@wepublish/permissions';
import {
  Route,
  Routes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';
import { BlockMap } from '@wepublish/ui/editor';
import type { Mock } from 'vitest';

import { renderWith } from '../event-list/test-helpers';
import { EventEditor } from './event-editor';
import { testEvent } from './test-event';

vi.mock('react-i18next', async () =>
  (await import('../event-list/test-translate')).i18nMock()
);

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useLazyQuery: vi.fn(() => [vi.fn(), { data: undefined }]),
  useMutation: vi.fn(),
  useApolloClient: vi.fn(),
}));

const mockedUseQuery = useQuery as unknown as Mock;
const mockedUseMutation = useMutation as unknown as Mock;
const mockedUseApolloClient = useApolloClient as unknown as Mock;

const EDITOR = [
  CanGetEvent.id,
  CanCreateEvent.id,
  CanUpdateEvent.id,
  CanPublishEvent.id,
];

let event: EditorEventFragment;
const mutations = new Map<unknown, Mock>();
const query = vi.fn();

const mutation = (document: unknown) => {
  if (!mutations.has(document)) {
    mutations.set(document, vi.fn().mockResolvedValue({ data: {} }));
  }

  return mutations.get(document)!;
};

beforeEach(() => {
  event = testEvent();
  mutations.clear();
  mutation(UpdateEventDocument).mockImplementation(async () => ({
    data: { updateEvent: event },
  }));
  mutation(UpdateEventContentDocument).mockImplementation(async () => ({
    data: { updateEventContent: event },
  }));
  mutation(CreateEventDocument).mockResolvedValue({
    data: { createEvent: { ...event, id: 'event-new' } },
  });
  mutation(DuplicateEventDocument).mockResolvedValue({
    data: { duplicateEvent: { id: 'event-copy' } },
  });

  query
    .mockReset()
    .mockImplementation(async ({ query: document }) =>
      document === EditorEventDocument ? { data: { event } } : { data: {} }
    );
  mockedUseApolloClient.mockReturnValue({ query });

  mockedUseQuery.mockReset().mockImplementation((document, options) => {
    if (document === EditorEventDocument) {
      return options?.skip ?
          { data: undefined, loading: false }
        : { data: { event }, loading: false };
    }

    if (document === TagListDocument) {
      return {
        data: {
          tags: {
            nodes: [
              {
                __typename: 'Tag',
                id: 'tag-1',
                tag: 'Konzert',
                type: TagType.Event,
              },
            ],
            totalCount: 1,
          },
        },
        refetch: vi.fn(),
      };
    }

    if (document === EditorEventOccurrencesDocument) {
      return {
        data: { agenda: { nodes: [], totalCount: 0 } },
        loading: false,
      };
    }

    return { data: undefined, loading: false, refetch: vi.fn() };
  });

  mockedUseMutation.mockImplementation(document => [
    mutation(document),
    { loading: false },
  ]);
});

function LocationProbe() {
  const location = useLocation();
  const type = useNavigationType();

  return (
    <output data-testid="location">
      {`${type} ${location.pathname}${location.search}`}
    </output>
  );
}

const renderEditor = ({
  route = '/events/edit/event-1',
  permissions = EDITOR,
}: { route?: string; permissions?: string[] } = {}) =>
  render(
    renderWith(
      <>
        <Routes>
          <Route
            path="/events/create"
            element={<EventEditor />}
          />
          <Route
            path="/events/edit/:id"
            element={<EventEditor />}
          />
        </Routes>
        <LocationProbe />
      </>,
      { permissions, route }
    )
  );

const nameField = () =>
  screen.findByRole('textbox', { name: 'agenda.editor.name', hidden: true });

const saveButton = () => screen.getByRole('button', { name: 'save' });

describe('EventEditor', () => {
  it('loads the event into the form through async default values', async () => {
    renderEditor();

    expect(await nameField()).toHaveValue('Qui-vive');
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        query: EditorEventDocument,
        variables: { id: 'event-1' },
      })
    );
  });

  it('names the page with a level-one heading', async () => {
    renderEditor();
    await nameField();

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'agenda.editor.heading Qui-vive',
      })
    ).toBeInTheDocument();
  });

  it('names a new event page with a level-one heading', async () => {
    renderEditor({ route: '/events/create' });
    await nameField();

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'agenda.editor.headingNew',
      })
    ).toBeInTheDocument();
  });

  it('names the Metadata drawer after its title', async () => {
    renderEditor({ route: '/events/edit/event-1?tab=dates' });

    expect(
      await screen.findByRole('dialog', { name: 'agenda.editor.metadata' })
    ).toBeInTheDocument();
  });

  it('counts the name against 130 and the description against 6,400 characters', async () => {
    renderEditor();
    await nameField();

    expect(screen.getByText('agenda.editor.nameCount 8 130')).toBeTruthy();
    expect(
      screen.getByText('agenda.editor.descriptionCount 0 6,400')
    ).toBeTruthy();
  });

  it('offers every block the article editor offers', async () => {
    renderEditor();
    await nameField();

    fireEvent.click(
      screen.getAllByRole('button', { name: 'blockList.addBlock' })[0]
    );

    expect(screen.getAllByRole('menuitem')).toHaveLength(
      Object.keys(BlockMap).length
    );
  });

  it('has one Save button and no autosave', async () => {
    renderEditor();
    await nameField();

    expect(screen.getAllByRole('button', { name: 'save' })).toHaveLength(1);
    expect(screen.queryByText(/autosave/i)).toBeNull();
  });

  it('saves a changed name as content only', async () => {
    renderEditor();

    fireEvent.change(await nameField(), { target: { value: 'Qui-vive II' } });
    fireEvent.click(saveButton());

    await waitFor(() =>
      expect(mutation(UpdateEventContentDocument)).toHaveBeenCalled()
    );
    expect(mutation(UpdateEventContentDocument).mock.calls[0][0]).toMatchObject(
      { variables: { id: 'event-1', input: { name: 'Qui-vive II' } } }
    );
    expect(mutation(UpdateEventDocument)).not.toHaveBeenCalled();
    expect(mutation(UpdateEventImageAltTextDocument)).not.toHaveBeenCalled();
  });

  it('says what was saved and what was not when the content fails, and keeps the input', async () => {
    mutation(UpdateEventContentDocument).mockRejectedValue(
      new Error('The description is too long')
    );
    renderEditor({ route: '/events/edit/event-1?tab=general' });

    const name = await nameField();
    fireEvent.change(name, { target: { value: 'Qui-vive II' } });
    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: 'agenda.editor.status' })
    );
    fireEvent.click(
      screen.getByRole('option', { name: 'agenda.status.SoldOut' })
    );
    fireEvent.click(saveButton());

    const alert = await screen.findByRole('alert');

    expect(mutation(UpdateEventDocument).mock.calls[0][0]).toMatchObject({
      variables: { id: 'event-1', input: { status: EventStatus.SoldOut } },
    });
    expect(alert).toHaveTextContent('agenda.editor.saveResult.saved');
    expect(alert).toHaveTextContent('agenda.editor.saveGroups.facts');
    expect(alert).toHaveTextContent('agenda.editor.saveResult.notSaved');
    expect(alert).toHaveTextContent('agenda.editor.saveGroups.content');
    expect(alert).toHaveTextContent('The description is too long');
    expect(name).toHaveValue('Qui-vive II');

    mutation(UpdateEventDocument).mockClear();
    mutation(UpdateEventContentDocument).mockResolvedValue({
      data: { updateEventContent: event },
    });
    fireEvent.click(saveButton());

    await waitFor(() =>
      expect(mutation(UpdateEventContentDocument)).toHaveBeenCalledTimes(2)
    );
    expect(mutation(UpdateEventDocument)).not.toHaveBeenCalled();
  });

  it('opens the Dates tab with the end date focused from a deep link', async () => {
    renderEditor({ route: '/events/edit/event-1?tab=dates&focus=dateTo' });

    const drawer = await screen.findByRole('presentation');
    expect(
      within(drawer).getByRole('tab', { name: 'agenda.editor.tabs.dates' })
    ).toHaveAttribute('aria-selected', 'true');

    await waitFor(() =>
      expect(document.activeElement).toBe(
        within(drawer).getByLabelText('agenda.schedule.span.weekly.dateTo')
      )
    );
  });

  it('offers exactly the General, Dates, Pricing and Social Media tabs', async () => {
    renderEditor({ route: '/events/edit/event-1?tab=general' });

    expect(
      (await screen.findAllByRole('tab')).map(tab => tab.textContent)
    ).toEqual([
      'agenda.editor.tabs.general',
      'agenda.editor.tabs.dates',
      'agenda.editor.tabs.pricing',
      'agenda.editor.tabs.social',
    ]);
  });

  it('creates the event, then opens it in place of the create page', async () => {
    renderEditor({ route: '/events/create?tab=general' });

    expect(await nameField()).toHaveValue('');
    expect(query).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('button', { name: 'agenda.editor.publish.button' })
    ).toBeNull();

    fireEvent.change(await nameField(), { target: { value: 'Neu' } });
    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: 'agenda.form.tags' })
    );
    fireEvent.click(screen.getByRole('option', { name: 'Konzert' }));
    fireEvent.click(
      screen.getByRole('tab', { name: 'agenda.editor.tabs.dates' })
    );
    fireEvent.change(
      screen.getByLabelText('agenda.schedule.span.continuous.dateFrom'),
      { target: { value: '2027-05-26' } }
    );
    fireEvent.change(
      screen.getByLabelText('agenda.schedule.span.continuous.dateTo'),
      { target: { value: '2027-05-26' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(mutation(CreateEventDocument)).toHaveBeenCalledWith({
        variables: {
          input: expect.objectContaining({
            tagIds: ['tag-1'],
            dateFrom: '2027-05-26T18:00:00.000Z',
          }),
          content: expect.objectContaining({ name: 'Neu' }),
        },
      })
    );
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        'REPLACE /events/edit/event-new'
      )
    );
  });

  it('opens the tab with the first problem instead of creating', async () => {
    renderEditor({ route: '/events/create' });

    fireEvent.change(await nameField(), { target: { value: 'Neu' } });
    fireEvent.click(screen.getByRole('button', { name: 'create' }));

    const drawer = await screen.findByRole('presentation');

    expect(
      within(drawer).getByRole('tab', { name: 'agenda.editor.tabs.general' })
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      await within(drawer).findByText('agenda.form.errors.tagsRequired 1')
    ).toBeInTheDocument();
    expect(mutation(CreateEventDocument)).not.toHaveBeenCalled();
  });

  it('requests review for someone who may not publish', async () => {
    event = testEvent({
      viewerCan: {
        ...testEvent().viewerCan!,
        publish: false,
        requestReview: true,
      },
    });
    renderEditor();
    await nameField();

    fireEvent.click(
      screen.getByRole('button', { name: 'agenda.editor.review.request' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'agenda.editor.review.confirm' })
    );

    await waitFor(() =>
      expect(mutation(RequestEventReviewDocument)).toHaveBeenCalledWith({
        variables: { id: 'event-1' },
      })
    );
  });

  it('saves unsaved changes before publishing', async () => {
    renderEditor();

    fireEvent.change(await nameField(), { target: { value: 'Qui-vive II' } });
    fireEvent.click(
      screen.getByRole('button', { name: 'agenda.editor.publish.button' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'agenda.editor.publish.confirm' })
    );

    await waitFor(() =>
      expect(mutation(PublishEventDocument)).toHaveBeenCalledWith({
        variables: { id: 'event-1', publishAt: null },
      })
    );
    expect(mutation(UpdateEventContentDocument)).toHaveBeenCalled();
  });

  it('duplicates the event and opens the copy', async () => {
    renderEditor();
    await nameField();

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'agenda.editor.duplicate' })
      );
    });

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/events/edit/event-copy'
      )
    );
  });

  it('explains why a read-only event cannot be saved', async () => {
    event = testEvent({
      viewerCan: {
        ...testEvent().viewerCan!,
        update: false,
        publish: false,
        delete: false,
        duplicate: false,
      },
    });
    renderEditor();
    await nameField();

    expect(screen.queryByRole('button', { name: 'save' })).toBeNull();
    expect(
      screen.getByText('agenda.editor.readOnly Equilibre')
    ).toBeInTheDocument();
  });
});
