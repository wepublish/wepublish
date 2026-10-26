import { zodResolver } from '@hookform/resolvers/zod';
import { render, screen } from '@testing-library/react';
import {
  EditorOrganizationFragment,
  EditorOrganizationListItemFragment,
} from '@wepublish/editor/api';
import { ReactNode } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { renderWith } from '../event-list/test-helpers';
import {
  emptyOrganizationForm,
  OrganizationFormValues,
  organizationFormSchema,
} from './organization-form-schema';

type SensitiveOrganization = Extract<
  EditorOrganizationFragment,
  { __typename: 'SensitiveDataOrganization' }
>;

export const testOrganization = (
  overrides: Omit<Partial<SensitiveOrganization>, '__typename'> & {
    __typename?: EditorOrganizationFragment['__typename'];
  } = {}
): EditorOrganizationFragment =>
  ({
    __typename: 'SensitiveDataOrganization',
    id: 'org-1',
    name: 'Equilibre',
    slug: 'equilibre',
    subTitle: 'Théâtre',
    about: 'Theatre in Fribourg',
    website: 'https://equilibre.ch',
    legalStatus: 'association',
    enabled: true,
    address: 'Place Jean-Tinguely 1',
    zip: '1700',
    city: 'Fribourg',
    regionId: 'region-1',
    tags: [{ __typename: 'Tag', id: 'tag-1', tag: 'Theater' }],
    affiliations: [
      { __typename: 'EventAffiliation', id: 'aff-1', name: 'Kulturlegi' },
    ],
    contacts: [
      {
        __typename: 'OrganizationContact',
        id: 'contact-1',
        label: 'Kasse',
        email: 'kasse@equilibre.ch',
        phone: null,
      },
    ],
    viewerCan: {
      __typename: 'OrganizationViewerPermissions',
      update: true,
      updatePrivileged: true,
      delete: true,
      manageMembers: true,
    },
    partner: true,
    createdByMigration: false,
    postOfficeBox: 'Postfach 12',
    createdAt: '2026-01-01T00:00:00.000Z',
    modifiedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  }) as EditorOrganizationFragment;

export const testOrganizationListItem = (
  overrides: Record<string, unknown> = {}
): EditorOrganizationListItemFragment =>
  ({
    __typename: 'SensitiveDataOrganization',
    id: 'org-1',
    name: 'Equilibre',
    zip: '1700',
    city: 'Fribourg',
    enabled: true,
    partner: false,
    createdByMigration: false,
    members: [{ __typename: 'OrganizationMember', userId: 'user-1' }],
    viewerCan: {
      __typename: 'OrganizationViewerPermissions',
      update: true,
      delete: true,
    },
    ...overrides,
  }) as EditorOrganizationListItemFragment;

function Values() {
  const values = useWatch<OrganizationFormValues>();

  return (
    <output data-testid="organization-values">
      {JSON.stringify(values ?? {})}
    </output>
  );
}

function OrganizationFormHarness({
  children,
  defaultValues,
  onSubmit,
}: {
  children: ReactNode;
  defaultValues: Partial<OrganizationFormValues>;
  onSubmit: (values: OrganizationFormValues) => void;
}) {
  const form = useForm<OrganizationFormValues>({
    defaultValues: { ...emptyOrganizationForm(), ...defaultValues },
    resolver: zodResolver(organizationFormSchema),
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {children}
        <button type="submit">submit</button>
        <Values />
      </form>
    </FormProvider>
  );
}

export const renderInOrganizationForm = (
  ui: ReactNode,
  {
    defaultValues = {},
    permissions = [],
  }: {
    defaultValues?: Partial<OrganizationFormValues>;
    permissions?: string[];
  } = {}
) => {
  const onSubmit = vi.fn();

  render(
    renderWith(
      <OrganizationFormHarness
        defaultValues={defaultValues}
        onSubmit={onSubmit}
      >
        {ui}
      </OrganizationFormHarness>,
      { permissions, route: '/organizations' }
    )
  );

  return onSubmit;
};

export const organizationValues = (): OrganizationFormValues =>
  JSON.parse(screen.getByTestId('organization-values').textContent ?? '{}');
