import { createTheme, ThemeProvider } from '@mui/material';
import {
  EditorEventListItemFragment,
  EventScheduleType,
  EventStatus,
  FullUserRoleFragment,
} from '@wepublish/editor/api';
import { AuthContext } from '@wepublish/ui/editor';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

const theme = createTheme({ cssVariables: true });

export { translate } from './test-translate';

export const sessionWith = (permissionIds: string[] | undefined) => ({
  session: {
    email: 'organiser@example.com',
    sessionToken: 'token',
    sessionRoles:
      permissionIds &&
      ([
        {
          __typename: 'UserRole',
          id: 'role',
          name: 'role',
          description: '',
          systemRole: false,
          permissions: permissionIds.map(id => ({
            __typename: 'Permission',
            id,
            description: id,
            deprecated: false,
          })),
        },
      ] as unknown as FullUserRoleFragment[]),
  },
});

export const renderWith = (
  ui: ReactNode,
  {
    permissions,
    route = '/events',
  }: { permissions?: string[]; route?: string } = {}
) => (
  <ThemeProvider theme={theme}>
    <AuthContext.Provider value={sessionWith(permissions)}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </AuthContext.Provider>
  </ThemeProvider>
);

export const listItem = (
  overrides: Partial<EditorEventListItemFragment> = {}
): EditorEventListItemFragment => ({
  __typename: 'Event',
  id: 'event-1',
  name: 'Qui-vive',
  status: EventStatus.Confirmed,
  scheduleType: EventScheduleType.Continuous,
  lastDateAt: '2027-05-26T19:00:00.000Z',
  modifiedAt: '2026-10-20T10:00:00.000Z',
  reviewRequestedAt: null,
  upcomingOccurrenceCount: 1,
  draft: { __typename: 'EventRevision', id: 'rev-1' },
  pending: null,
  published: null,
  nextOccurrence: {
    __typename: 'Occurrence',
    id: 'occ-1',
    dateFrom: '2027-05-26T17:00:00.000Z',
    dateTo: '2027-05-26T19:00:00.000Z',
  },
  place: { __typename: 'Place', id: 'place-1', name: 'Nuithonie' },
  organization: {
    __typename: 'Organization',
    id: 'org-1',
    name: 'Equilibre',
  } as EditorEventListItemFragment['organization'],
  viewerCan: {
    __typename: 'EventViewerPermissions',
    update: true,
    publish: true,
    delete: true,
    duplicate: true,
  },
  ...overrides,
});
