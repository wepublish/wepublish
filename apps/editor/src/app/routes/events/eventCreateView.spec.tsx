import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import {
  type CreateEventMutation,
  type CreateEventMutationVariables,
  type FullEventFragment,
  type WebsiteSettingsQuery,
  CreateEventDocument,
  EventStatus,
  WebsiteSettingsDocument,
} from '@wepublish/editor/api';
import {
  formSectionOf,
  getFieldByLabel,
  imageFixture,
  imageListMock,
  queryFieldByLabel,
  renderFormRoutes,
  tagFixture,
  tagListMock,
  tagMock,
} from '@wepublish/form/editor/testing';
import {
  CanCreateImage,
  CanDeleteImage,
  CanGetImage,
  CanGetImages,
} from '@wepublish/permissions';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import { GraphQLError } from 'graphql';
import type { ReactNode } from 'react';

import { EventCreateView } from './eventCreateView';

const portrait = imageFixture('image-portrait', 'Portrait');
const jazz = tagFixture('tag-jazz', 'Jazz');
const rock = tagFixture('tag-rock', 'Rock');

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

const createdEvent: FullEventFragment = {
  __typename: 'Event',
  id: 'event-created',
  name: 'Konzert',
  lead: null,
  description: null,
  status: EventStatus.Scheduled,
  location: null,
  image: null,
  tags: [],
  startsAt: '2026-12-24T18:30:00.000Z',
  endsAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  url: 'https://example.com/event/event-created',
  externalSourceName: null,
  externalSourceId: null,
};

const sent = vi.fn<(variables: CreateEventMutationVariables) => void>();

const createEvent = (
  errors?: readonly GraphQLError[]
): MockLink.MockedResponse => ({
  request: { query: CreateEventDocument, variables: () => true },
  result: (variables: CreateEventMutationVariables) => {
    sent(JSON.parse(JSON.stringify(variables)));

    if (errors) {
      return { errors };
    }

    const data: CreateEventMutation = {
      __typename: 'Mutation',
      createEvent: createdEvent,
    };

    return { data };
  },
});

const mocks = (errors?: readonly GraphQLError[]) => [
  websiteSettings,
  tagListMock([jazz, rock]),
  tagMock(jazz),
  imageListMock([portrait]),
  createEvent(errors),
];

function ImageEditor({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={imageEditor}>{children}</AuthContext.Provider>
  );
}

const renderCreate = (errors?: readonly GraphQLError[]) =>
  renderFormRoutes(
    { '/events/create': <EventCreateView /> },
    { route: '/events/create', mocks: mocks(errors), wrapper: ImageEditor }
  );

const name = () => getFieldByLabel(/^event\.form\.name/);
const location = () => getFieldByLabel(/^event\.form\.location/);
const startsAt = () => getFieldByLabel(/^event\.form\.startsAt/);
const endsAt = () => getFieldByLabel(/^event\.form\.endsAt/);
const lead = () => getFieldByLabel(/^event\.form\.lead/);

const sectionOf = (label: RegExp) => {
  const [text] = screen.getAllByText(label);
  const section = text.closest<HTMLElement>('.MuiFormControl-root');

  if (!section) {
    throw new Error(`No form control around ${label}`);
  }

  return section;
};

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

const typeDate = async (
  user: UserEvent,
  input: HTMLInputElement,
  text: string
) => {
  await user.click(input);
  await user.keyboard(text);
  await user.keyboard('{Escape}');
};

const typeDescription = async (user: UserEvent, text: string) => {
  const editable = await waitFor(() => {
    const found = sectionOf(
      /^event\.form\.description/
    ).querySelector<HTMLElement>('.tiptap');

    if (!found) {
      throw new Error('The rich text editor has not mounted yet');
    }

    return found;
  });

  await user.click(editable.querySelector('p') ?? editable);
  await user.keyboard(text);
};

const pickTag = async (user: UserEvent, tag: string) => {
  await user.click(
    within(sectionOf(/^event\.form\.tags/)).getByRole('combobox')
  );
  await user.click(await screen.findByRole('option', { name: tag }));
};

const chooseImage = async (user: UserEvent, title: string) => {
  await user.click(
    within(sectionOf(/^event\.form\.image/)).getByRole('button', {
      name: 'chooseEditImage.chooseImage',
    })
  );
  await user.click(
    await screen.findByRole('button', { name: new RegExp(title) })
  );
  await waitFor(
    () =>
      expect(document.querySelector('.MuiDrawer-root')).not.toBeInTheDocument(),
    { timeout: 5000 }
  );
};

const fillRequired = async (user: UserEvent) => {
  await user.type(name(), 'Konzert');
  await typeDate(user, startsAt(), '24.12.2026 18:30');
};

const unloadBlocked = () => {
  const event = new Event('beforeunload', { cancelable: true });

  window.dispatchEvent(event);

  return event.defaultPrevented;
};

beforeEach(() => {
  sent.mockClear();
});

describe('EventCreateView', () => {
  it('shows the create fields without status and external source', () => {
    renderCreate();

    expect(screen.getByText('event.create.title')).toBeInTheDocument();
    expect(name()).toHaveValue('');
    expect(location()).toHaveValue('');
    expect(startsAt()).toHaveValue('');
    expect(endsAt()).toHaveValue('');
    expect(lead()).toHaveValue('');
    expect(lead().tagName).toBe('TEXTAREA');
    expect(sectionOf(/^event\.form\.description/)).toBeInTheDocument();
    expect(
      within(sectionOf(/^event\.form\.tags/)).getByRole('combobox')
    ).toBeInTheDocument();
    expect(
      within(sectionOf(/^event\.form\.image/)).getByRole('button', {
        name: 'chooseEditImage.chooseImage',
      })
    ).toBeInTheDocument();
    expect(screen.queryByText(/^event\.form\.status/)).not.toBeInTheDocument();
    expect(queryFieldByLabel(/^event\.form\.externalSource/)).toBeNull();
  });

  it('marks the name and the start as required', () => {
    renderCreate();

    expect(getFieldByLabel('event.form.name*')).toBeRequired();
    expect(getFieldByLabel('event.form.startsAt*')).toBe(startsAt());
    expect(getFieldByLabel('event.form.location')).not.toBeRequired();
    expect(getFieldByLabel('event.form.endsAt')).toBe(endsAt());
    expect(getFieldByLabel('event.form.lead')).not.toBeRequired();
  });

  it('reports a missing name as soon as the field is left', async () => {
    const { user } = renderCreate();

    await user.click(name());
    await user.tab();

    await waitFor(() =>
      expect(name()).toHaveAccessibleDescription('form.errors.required')
    );
    expect(sent).not.toHaveBeenCalled();
  });

  it('asks for a name and a start before it creates anything', async () => {
    const { user } = renderCreate();

    await user.click(save());

    await waitFor(() =>
      expect(name()).toHaveAccessibleDescription('form.errors.required')
    );
    expect(startsAt()).toHaveAccessibleDescription('form.errors.required');
    expect(sent).not.toHaveBeenCalled();
  });

  it('rejects an end before the start', async () => {
    const { user } = renderCreate();

    await fillRequired(user);
    await typeDate(user, endsAt(), '24.12.2026 17:00');
    await user.click(save());

    await waitFor(() =>
      expect(endsAt()).toHaveAccessibleDescription('event.form.endsBeforeStart')
    );
    expect(sent).not.toHaveBeenCalled();
  });

  it('accepts an end at the same time as the start', async () => {
    const { user } = renderCreate();

    await fillRequired(user);
    await typeDate(user, endsAt(), '24.12.2026 18:30');
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0].endsAt).toBe('2026-12-24T18:30:00.000Z');
  });

  it('creates the event with everything entered and opens it', async () => {
    const { user, currentPath } = renderCreate();

    await fillRequired(user);
    await user.type(location(), 'Rote Fabrik');
    await typeDate(user, endsAt(), '24.12.2026 23:00');
    await user.type(lead(), 'Ein Abend mit Jazz');
    await typeDescription(user, 'Wieder');
    await pickTag(user, 'Jazz');
    await chooseImage(user, 'Portrait');
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual({
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
            content: [{ type: 'text', text: 'Wieder' }],
          },
        ],
      },
      tagIds: ['tag-jazz'],
      imageId: 'image-portrait',
    });
    await waitFor(() =>
      expect(currentPath()).toBe('/events/edit/event-created')
    );
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();
  });

  it('sends untouched optional fields as empty values', async () => {
    const { user } = renderCreate();

    await fillRequired(user);
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toStrictEqual({
      name: 'Konzert',
      location: null,
      startsAt: '2026-12-24T18:30:00.000Z',
      endsAt: null,
      lead: null,
      description: null,
      tagIds: [],
      imageId: null,
    });
  });

  it('sends cleared text fields as null', async () => {
    const { user } = renderCreate();

    await fillRequired(user);
    await user.type(location(), 'Rote Fabrik');
    await user.clear(location());
    await user.type(lead(), 'Ein Abend');
    await user.clear(lead());
    await user.click(save());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent.mock.calls[0][0]).toMatchObject({ location: null, lead: null });
  });

  it('goes back to the list after save and close', async () => {
    const { user, currentPath } = renderCreate();

    await fillRequired(user);
    await user.click(saveAndClose());

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(currentPath()).toBe('/events'));
  });

  it('warns before the page is left with unsaved input', async () => {
    const { user } = renderCreate();

    expect(unloadBlocked()).toBe(false);

    await user.type(name(), 'K');

    await waitFor(() => expect(unloadBlocked()).toBe(true));
  });

  it('shows a server error and stays on the form', async () => {
    const { user, currentPath } = renderCreate([
      new GraphQLError('An event with this name already exists'),
    ]);

    await fillRequired(user);
    await user.click(save());

    expect(
      await screen.findByText('An event with this name already exists')
    ).toBeInTheDocument();
    expect(screen.getByText('form.errors.server')).toBeInTheDocument();
    expect(currentPath()).toBe('/events/create');
    expect(name()).toHaveValue('Konzert');
  });

  it('renders its sections as regions', () => {
    renderCreate();

    expect(
      formSectionOf('event.form.sections.details').getByLabelText(
        /^event\.form\.name/,
        { selector: 'input' }
      )
    ).toBe(name());
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
      formSectionOf('event.form.sections.content').getByLabelText(
        /^event\.form\.lead/,
        { selector: 'textarea' }
      )
    ).toBe(lead());
    expect(
      formSectionOf('event.form.sections.content').getByText(
        /^event\.form\.description/
      )
    ).toBeInTheDocument();
    expect(
      formSectionOf('event.form.sections.media').getByRole('button', {
        name: 'chooseEditImage.chooseImage',
      })
    ).toBeInTheDocument();
    expect(
      formSectionOf('event.form.sections.media').getByRole('combobox')
    ).toBeInTheDocument();
  });

  it('puts media and tags after the main sections', () => {
    renderCreate();

    expect(sectionTitles()).toEqual([
      'event.form.sections.details',
      'event.form.sections.schedule',
      'event.form.sections.content',
      'event.form.sections.media',
    ]);
  });

  it('asks before leaving dirty through the back link', async () => {
    const { user, currentPath } = renderCreate();

    await user.type(name(), 'Konzert');
    await user.click(screen.getByRole('link', { name: 'back' }));

    expect(
      screen.getByRole('dialog', { name: 'form.view.discardChanges.title' })
    ).toBeInTheDocument();
    expect(currentPath()).toBe('/events/create');

    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.discard' })
    );

    await waitFor(() => expect(currentPath()).toBe('/events'));
    expect(sent).not.toHaveBeenCalled();
  });
});
