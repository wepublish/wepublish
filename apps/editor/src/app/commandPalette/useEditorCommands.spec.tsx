import {
  CanCreateEvent,
  CanGetTags,
  EditorPermissions,
} from '@wepublish/permissions';
import { AuthContext } from '@wepublish/ui/editor';
import { renderHook } from '@testing-library/react';
import { ReactNode } from 'react';

import { useEditorCommands } from './useEditorCommands';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { getFixedT: () => (key: string) => key },
  }),
}));

const role = (permissions: string[]) => ({
  id: 'role',
  name: 'role',
  description: '',
  systemRole: false,
  permissions: permissions.map(id => ({
    id,
    description: id,
    deprecated: false,
  })),
});

const wrapperFor =
  (session: unknown) =>
  ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={{ session } as never}>
      {children}
    </AuthContext.Provider>
  );

const idsFrom = (session: unknown) =>
  renderHook(() => useEditorCommands(), {
    wrapper: wrapperFor(session),
  }).result.current.map(command => command.id);

describe('useEditorCommands', () => {
  it('offers only what the session may reach', () => {
    const ids = idsFrom({
      email: 'editor@wepublish.ch',
      sessionToken: 'token',
      sessionRoles: [role(['CAN_GET_ARTICLES', 'CAN_CREATE_ARTICLE'])],
    });

    expect(ids).toContain('articles');
    expect(ids).toContain('createArticle');
    expect(ids).not.toContain('users');
    expect(ids).not.toContain('createUser');
  });

  it('offers an editor-role user nothing from the agenda, but keeps their tags', () => {
    const ids = idsFrom({
      email: 'editor@wepublish.ch',
      sessionToken: 'token',
      sessionRoles: [role(EditorPermissions.map(({ id }) => id))],
    });

    expect(
      [
        'events',
        'organizations',
        'venues',
        'eventTags',
        'createEvent',
        'createOrganization',
        'createVenue',
        'createEventTag',
      ].filter(id => ids.includes(id))
    ).toEqual([]);
    expect(ids).toEqual(
      expect.arrayContaining(['articleTags', 'commentTags', 'createCommentTag'])
    );
  });

  it('offers event tags to someone who may file events and read tags', () => {
    const ids = idsFrom({
      email: 'organiser@wepublish.ch',
      sessionToken: 'token',
      sessionRoles: [role([CanCreateEvent.id, CanGetTags.id])],
    });

    expect(ids).toContain('eventTags');
  });

  it('keeps the pages that need no permission at all', () => {
    const ids = idsFrom({
      email: 'editor@wepublish.ch',
      sessionToken: 'token',
      sessionRoles: [role([])],
    });

    expect(ids).toEqual(
      expect.arrayContaining(['dashboard', 'notifications', 'logout'])
    );
  });

  it('opens on the favourites, then the pages, then the create commands', () => {
    const ids = idsFrom(undefined);

    expect(ids.slice(0, 3)).toEqual(['articles', 'pages', 'blockTemplates']);
    expect(ids.indexOf('blockTemplates')).toBeLessThan(ids.indexOf('comments'));
    expect(ids.indexOf('comments')).toBeLessThan(ids.indexOf('createArticle'));
    expect(ids.indexOf('createArticle')).toBeLessThan(ids.indexOf('logout'));
  });

  it('marks the favourites as such so they get their own heading', () => {
    const commands = renderHook(() => useEditorCommands(), {
      wrapper: wrapperFor(undefined),
    }).result.current;

    expect(
      commands.filter(command => command.group === 'favourite').map(c => c.id)
    ).toEqual(['articles', 'pages', 'blockTemplates']);
  });
});
