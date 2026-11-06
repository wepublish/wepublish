import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import {
  type EventQuery,
  type FullEventFragment,
  type UpdateEventMutation,
  type UpdateEventMutationVariables,
  type WebsiteSettingsQuery,
  EventDocument,
  EventStatus,
  UpdateEventDocument,
  WebsiteSettingsDocument,
} from '@wepublish/editor/api';
import {
  formSectionOf,
  getFieldByLabel,
  imageFixture,
  imageListMock,
  imageMock,
  queryFieldByLabel,
  renderFormRoutes,
  tagFixture,
  tagListMock,
  tagMock,
  updateImageMock,
} from '@wepublish/form/editor/testing';
import {
  CanCreateImage,
  CanDeleteImage,
  CanGetImage,
  CanGetImages,
} from '@wepublish/permissions';
import type { RichtextJSONDocument } from '@wepublish/richtext';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import { GraphQLError } from 'graphql';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { EventEditForm, EventEditView } from './eventEditView';

const portrait = imageFixture('image-portrait', 'Portrait');
const retitled = { ...portrait, title: 'Portrait im Park' };
const jazz = tagFixture('tag-jazz', 'Jazz');
const rock = tagFixture('tag-rock', 'Rock');

const paragraph = (text: string): RichtextJSONDocument => ({
  type: 'doc',
  attrs: undefined,
  content: [
    {
      type: 'paragraph',
      attrs: { textAlign: null },
      content: [{ type: 'text', attrs: undefined, text }],
    },
  ],
});

const keyDisabled = {
  __typename: 'KeyEnabled',
  enabled: false,
  key: null,
} as const;

const websiteSettingsData: WebsiteSettingsQuery = {
  __typename: 'Query',
  websiteSettings: {
    __typename: 'WebsiteSettings',
    theme: {},
    analytics: {
      __typename: 'WebsiteAnalytics',
      googleAnalytics: keyDisabled,
      googleTagManager: keyDisabled,
      plausible: keyDisabled,
      piwik: keyDisabled,
    },
    mail: { __typename: 'WebsiteMail', mailchimp: null },
    ads: { __typename: 'WebsiteAds', sparkLoop: keyDisabled },
    fonts: [],
  },
};

const websiteSettings: MockLink.MockedResponse = {
  request: { query: WebsiteSettingsDocument, variables: {} },
  result: { data: websiteSettingsData },
  maxUsageCount: Number.POSITIVE_INFINITY,
};

const imageEditor: AuthContextState = {
  session: {
    email: 'editor@example.com',
    sessionToken: 'session-token',
    sessionRoles: [
      {
        __typename: 'UserRole',
        id: 'image-editor',
        name: 'image-editor',
        description: null,
        systemRole: false,
        permissions: [
          CanCreateImage,
          CanGetImage,
          CanGetImages,
          CanDeleteImage,
        ].map(permission => ({
          __typename: 'Permission' as const,
          ...permission,
        })),
      },
    ],
  },
};

const loadedEvent: FullEventFragment = {
  __typename: 'Event',
  id: 'event-1',
  name: 'Konzert',
  lead: 'Ein Abend mit Jazz',
  description: paragraph('Programm'),
  status: EventStatus.Postponed,
  location: 'Rote Fabrik',
  image: portrait,
  tags: [jazz],
  startsAt: '2026-12-24T18:30:00.000Z',
  endsAt: '2026-12-24T23:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  url: 'https://example.com/event/event-1',
  externalSourceName: null,
  externalSourceId: null,
};

const unchangedVariables = {
  id: 'event-1',
  name: 'Konzert',
  location: 'Rote Fabrik',
  startsAt: '2026-12-24T18:30:00.000Z',
  endsAt: '2026-12-24T23:00:00.000Z',
  lead: 'Ein Abend mit Jazz',
  description: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        attrs: { textAlign: null },
        content: [{ type: 'text', text: 'Programm' }],
      },
    ],
  },
  status: EventStatus.Postponed,
  imageId: 'image-portrait',
  tagIds: ['tag-jazz'],
};

const sent = vi.fn<(variables: UpdateEventMutationVariables) => void>();
const imageUpdates = vi.fn();

const eventQuery = (
  event: FullEventFragment,
  delay = 0
): MockLink.MockedResponse => {
  const data: EventQuery = { __typename: 'Query', event };

  return {
    request: { query: EventDocument, variables: { id: event.id } },
    result: { data },
    delay,
    maxUsageCount: Number.POSITIVE_INFINITY,
  };
};

const updateEvent = (
  errors?: readonly GraphQLError[]
): MockLink.MockedResponse => ({
  request: { query: UpdateEventDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: UpdateEventMutationVariables) => {
    sent(JSON.parse(JSON.stringify(variables)));

    if (errors) {
      return { errors };
    }

    const data: UpdateEventMutation = {
      __typename: 'Mutation',
      updateEvent: loadedEvent,
    };

    return { data };
  },
});

const otherEvent: FullEventFragment = {
  ...loadedEvent,
  id: 'event-2',
  name: 'Lesung',
  location: 'Kaufleuten',
  tags: [],
  image: null,
};

const failingEventQuery: MockLink.MockedResponse = {
  request: { query: EventDocument, variables: { id: 'event-broken' } },
  result: { errors: [new GraphQLError('Event not found')] },
};

type RenderOptions = {
  event?: FullEventFragment;
  errors?: readonly GraphQLError[];
  delay?: number;
  route?: string;
};

function ImageEditor({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={imageEditor}>
      <Link
        to="/events/edit/event-2"
        data-testid="next-event"
      />
      {children}
    </AuthContext.Provider>
  );
}

const renderEdit = ({
  event = loadedEvent,
  errors,
  delay,
  route = `/events/edit/${event.id}`,
}: RenderOptions = {}) =>
  renderFormRoutes(
    { '/events/edit/:id': <EventEditView /> },
    {
      route,
      wrapper: ImageEditor,
      mocks: [
        websiteSettings,
        eventQuery(event, delay),
        eventQuery(otherEvent),
        failingEventQuery,
        updateEvent(errors),
        tagListMock([jazz, rock]),
        tagMock(jazz),
        tagMock(rock),
        imageListMock([portrait]),
        imageMock(portrait),
        updateImageMock(retitled, imageUpdates),
      ],
    }
  );

const name = () => getFieldByLabel(/^event\.form\.name/);
const location = () => getFieldByLabel(/^event\.form\.location/);
const startsAt = () => getFieldByLabel(/^event\.form\.startsAt/);
const endsAt = () => getFieldByLabel(/^event\.form\.endsAt/);
const lead = () => getFieldByLabel(/^event\.form\.lead/);
const externalSource = () => getFieldByLabel(/^event\.form\.externalSource/);

const sectionOf = (label: RegExp) => {
  const [text] = screen.getAllByText(label);
  const section = text.closest<HTMLElement>('.MuiFormControl-root');

  if (!section) {
    throw new Error(`No form control around ${label}`);
  }

  return section;
};

const statusSelect = () =>
  within(sectionOf(/^event\.form\.status/)).getByRole('combobox');

const imageSection = () => sectionOf(/^event\.form\.image/);

const sectionTitles = () =>
  screen
    .getAllByRole('region')
    .map(
      region =>
        document.getElementById(region.getAttribute('aria-labelledby') ?? '')
          ?.textContent
    );

const save = () => screen.getByRole('button', { name: 'save' });
const saveAndClose = () => screen.getByRole('button', { name: 'saveAndClose' });

const loaded = async () => {
  await waitFor(() => expect(name()).toHaveValue('Konzert'));
};

const drawerClosed = () =>
  waitFor(
    () =>
      expect(document.querySelector('.MuiDrawer-root')).not.toBeInTheDocument(),
    { timeout: 5000 }
  );

const clearDate = async (user: UserEvent, input: HTMLInputElement) => {
  const control = input.closest<HTMLElement>('.MuiFormControl-root');

  if (!control) {
    throw new Error('The date input has no form control');
  }

  await user.click(
    within(control).getByRole('button', { name: 'dateTimePicker.clear' })
  );
};

const unloadBlocked = () => {
  const event = new Event('beforeunload', { cancelable: true });

  window.dispatchEvent(event);

  return event.defaultPrevented;
};

beforeEach(() => {
  sent.mockClear();
  imageUpdates.mockClear();
});

describe('EventEditView', () => {
  it('is memoised by the React Compiler', () => {
    expect(EventEditForm.toString()).toMatch(/\$\[\d+\]/);
  });

  it('shows the header and a loading indicator until the event has loaded', async () => {
    renderEdit({ delay: 50 });

    expect(screen.getByText('event.edit.title')).toBeInTheDocument();
    expect(save()).toBeDisabled();
    expect(saveAndClose()).toBeDisabled();
    expect(
      screen.getByRole('progressbar', { name: 'form.loading' })
    ).toBeInTheDocument();
    expect(queryFieldByLabel(/^event\.form\.name/)).toBeNull();
    expect(screen.queryAllByRole('region')).toHaveLength(0);

    await loaded();

    expect(
      screen.queryByRole('progressbar', { name: 'form.loading' })
    ).not.toBeInTheDocument();
    expect(save()).toBeEnabled();
    expect(saveAndClose()).toBeEnabled();
  });

  it('explains a failed load and keeps the header', async () => {
    renderEdit({ route: '/events/edit/event-broken' });

    expect(await screen.findByText('form.loadError.title')).toBeInTheDocument();
    expect(screen.getByText('event.edit.title')).toBeInTheDocument();
    expect(save()).toBeDisabled();
    expect(saveAndClose()).toBeDisabled();
    expect(queryFieldByLabel(/^event\.form\.name/)).toBeNull();
    expect(screen.queryAllByRole('region')).toHaveLength(0);
  });

  it('loads the other event when the route changes', async () => {
    const { user } = renderEdit();

    await loaded();
    await user.click(screen.getByTestId('next-event'));

    await waitFor(() => expect(name()).toHaveValue('Lesung'));
    expect(location()).toHaveValue('Kaufleuten');
  });

  it('shows the loaded event', async () => {
    renderEdit();

    await loaded();

    expect(location()).toHaveValue('Rote Fabrik');
    expect(startsAt()).toHaveValue('24.12.2026 18:30');
    expect(endsAt()).toHaveValue('24.12.2026 23:00');
    expect(lead()).toHaveValue('Ein Abend mit Jazz');
    expect(
      await within(sectionOf(/^event\.form\.description/)).findByText(
        'Programm'
      )
    ).toBeInTheDocument();
    expect(statusSelect()).toHaveTextContent('event.form.statuses.Postponed');
    expect(getFieldByLabel('event.form.name*')).toBe(name());
    expect(screen.getAllByText('event.form.status*').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: 'event.form.statusInfo' })
    ).toBeInTheDocument();
    expect(
      await within(sectionOf(/^event\.form\.tags/)).findByText('Jazz')
    ).toBeInTheDocument();
    expect(within(imageSection()).getByAltText('Portrait')).toBeInTheDocument();
    expect(queryFieldByLabel(/^event\.form\.externalSource/)).toBeNull();
  });

  it('shows the external source of an imported event without letting it change', async () => {
    renderEdit({ event: { ...loadedEvent, externalSourceName: 'Eventfrog' } });

    await loaded();

    expect(externalSource()).toHaveValue('Eventfrog');
    expect(externalSource()).toHaveAttribute('readonly');
    expect(externalSource()).not.toBeDisabled();
  });

  it('saves the loaded values and stays on the event', async () => {
    const { user, currentPath } = renderEdit({
      event: { ...loadedEvent, externalSourceName: 'Eventfrog' },
    });

    await loaded();
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual(unchangedVariables);
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    expect(currentPath()).toBe('/events/edit/event-1');
    expect(name()).toHaveValue('Konzert');
  });

  it('goes back to the list after save and close', async () => {
    const { user, currentPath } = renderEdit();

    await loaded();
    await user.click(saveAndClose());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(currentPath()).toBe('/events'));
  });

  it('saves a new status, an open end and other tags', async () => {
    const { user } = renderEdit();

    await loaded();
    await user.click(statusSelect());

    expect(
      (await screen.findAllByRole('option')).map(option => option.textContent)
    ).toEqual([
      'event.form.statuses.Scheduled',
      'event.form.statuses.Cancelled',
      'event.form.statuses.Postponed',
      'event.form.statuses.Rescheduled',
    ]);

    await user.click(
      screen.getByRole('option', { name: 'event.form.statuses.Cancelled' })
    );
    await clearDate(user, endsAt());
    await user.click(
      within(sectionOf(/^event\.form\.tags/)).getByRole('combobox')
    );
    await user.click(await screen.findByRole('option', { name: 'Rock' }));
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual({
      ...unchangedVariables,
      status: EventStatus.Cancelled,
      endsAt: null,
      tagIds: ['tag-jazz', 'tag-rock'],
    });
  });

  it('clears the image once it was removed', async () => {
    const { user } = renderEdit();

    await loaded();
    await user.click(
      within(imageSection()).getByRole('button', {
        name: 'chooseEditImage.removeImage',
      })
    );
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual({
      ...unchangedVariables,
      imageId: null,
    });
  });

  it('saves the image in the edit drawer without saving the event', async () => {
    const { user } = renderEdit();

    await loaded();
    await user.click(
      within(imageSection()).getByRole('button', {
        name: 'chooseEditImage.editImage',
      })
    );

    const drawer = await screen.findByRole('dialog');
    const saveImage = await within(drawer).findByRole('button', {
      name: 'save',
    });

    await waitFor(() => expect(saveImage).toBeEnabled());
    await user.click(saveImage);

    await waitFor(() =>
      expect(imageUpdates).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'image-portrait' })
      )
    );
    await drawerClosed();

    expect(
      within(imageSection()).getByAltText('Portrait im Park')
    ).toBeInTheDocument();
    expect(sent).not.toHaveBeenCalled();

    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual(unchangedVariables);
  });

  it('warns about unsaved changes only while there are some', async () => {
    const { user } = renderEdit();

    await loaded();
    await within(sectionOf(/^event\.form\.description/)).findByText('Programm');

    expect(unloadBlocked()).toBe(false);

    await user.type(name(), ' am Abend');

    await waitFor(() => expect(unloadBlocked()).toBe(true));

    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(unloadBlocked()).toBe(false));
  });

  it('rejects an end before the start', async () => {
    const { user } = renderEdit();

    await loaded();
    await clearDate(user, endsAt());
    await user.click(endsAt());
    await user.keyboard('24.12.2026 17:00');
    await user.keyboard('{Escape}');
    await user.click(save());

    await waitFor(() =>
      expect(endsAt()).toHaveAccessibleDescription('event.form.endsBeforeStart')
    );
    expect(sent).not.toHaveBeenCalled();
  });

  it('asks for a name before saving', async () => {
    const { user } = renderEdit();

    await loaded();
    await user.clear(name());
    await user.click(save());

    await waitFor(() =>
      expect(name()).toHaveAccessibleDescription('form.errors.required')
    );
    expect(sent).not.toHaveBeenCalled();
  });

  it('shows a server error and keeps the entered values', async () => {
    const { user, currentPath } = renderEdit({
      errors: [new GraphQLError('The event could not be saved')],
    });

    await loaded();
    await user.clear(name());
    await user.type(name(), 'Neues Konzert');
    await user.click(save());

    expect(
      await screen.findByText('The event could not be saved')
    ).toBeInTheDocument();
    expect(screen.getByText('form.errors.server')).toBeInTheDocument();
    expect(name()).toHaveValue('Neues Konzert');
    expect(currentPath()).toBe('/events/edit/event-1');
  });

  it('renders its sections as regions', async () => {
    renderEdit({ event: { ...loadedEvent, externalSourceName: 'Eventfrog' } });

    await loaded();

    expect(
      formSectionOf('event.form.sections.details').getByLabelText(
        /^event\.form\.name/,
        { selector: 'input' }
      )
    ).toBe(name());
    expect(
      formSectionOf('event.form.sections.details').getByLabelText(
        /^event\.form\.externalSource/,
        { selector: 'input' }
      )
    ).toBe(externalSource());
    expect(
      formSectionOf('event.form.sections.details').getByLabelText(
        /^event\.form\.location/,
        { selector: 'input' }
      )
    ).toBe(location());
    expect(
      formSectionOf('event.form.sections.schedule').getByLabelText(
        /^event\.form\.startsAt/,
        { selector: 'input' }
      )
    ).toBe(startsAt());
    expect(
      formSectionOf('event.form.sections.schedule').getByLabelText(
        /^event\.form\.endsAt/,
        { selector: 'input' }
      )
    ).toBe(endsAt());
    expect(
      formSectionOf('event.form.sections.schedule').getByRole('combobox')
    ).toHaveTextContent('event.form.statuses.Postponed');
    expect(
      formSectionOf('event.form.sections.content').getByLabelText(
        /^event\.form\.lead/,
        { selector: 'textarea' }
      )
    ).toBe(lead());
    expect(
      await formSectionOf('event.form.sections.content').findByText('Programm')
    ).toBeInTheDocument();
    expect(
      formSectionOf('event.form.sections.media').getByAltText('Portrait')
    ).toBeInTheDocument();
    expect(
      await formSectionOf('event.form.sections.media').findByText('Jazz')
    ).toBeInTheDocument();
  });

  it('puts media and tags after the main sections', async () => {
    renderEdit();

    await loaded();

    expect(sectionTitles()).toEqual([
      'event.form.sections.details',
      'event.form.sections.schedule',
      'event.form.sections.content',
      'event.form.sections.media',
    ]);
  });

  it('asks before leaving dirty through the back link', async () => {
    const { user, currentPath } = renderEdit();

    await loaded();
    await user.type(name(), ' am Abend');
    await user.click(screen.getByRole('link', { name: 'back' }));

    expect(
      screen.getByRole('dialog', { name: 'form.view.discardChanges.title' })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.keep' })
    );

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', {
          name: 'form.view.discardChanges.title',
        })
      ).not.toBeInTheDocument()
    );
    expect(currentPath()).toBe('/events/edit/event-1');
    expect(name()).toHaveValue('Konzert am Abend');

    await user.click(screen.getByRole('link', { name: 'back' }));
    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.discard' })
    );

    await waitFor(() => expect(currentPath()).toBe('/events'));
    expect(sent).not.toHaveBeenCalled();
  });

  it('leaves a clean form through the back link without asking', async () => {
    const { user, currentPath } = renderEdit();

    await loaded();
    await user.click(screen.getByRole('link', { name: 'back' }));

    await waitFor(() => expect(currentPath()).toBe('/events'));
    expect(
      screen.queryByRole('dialog', { name: 'form.view.discardChanges.title' })
    ).not.toBeInTheDocument();
  });
});
