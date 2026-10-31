import { PuckContext } from '@puckeditor/core';
import { screen, within } from '@testing-library/react';
import {
  mockMemberPlan,
  mockOperation,
  mockPaginated,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { DatasourcesValue } from '@wepublish/puck-content/editor';
import { MemberPlanListDocument } from '@wepublish/website/api';
import type { BuilderSubscribeBlockProps } from '@wepublish/website/builder';
import { createElement, PropsWithChildren } from 'react';

import { FormContext } from '../form/form/form.context';
import { selectMemberPlans } from './subscribe-member-plans';
import { SubscribeRender } from './subscribe.component';
import { SubscribeConfig } from './subscribe.config';

vi.mock('@wepublish/block-content/website', async importOriginal => ({
  ...(await importOriginal<
    typeof import('@wepublish/block-content/website')
  >()),
  SubscribeBlockProvider: ({ children }: PropsWithChildren) => children,
}));

vi.mock('@wepublish/website/builder', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/website/builder')>()),
  SubscribeBlock: ({ memberPlans }: BuilderSubscribeBlockProps) => (
    <ul aria-label="Offered plans">
      {memberPlans.map(plan => (
        <li key={plan.id}>{plan.name}</li>
      ))}
    </ul>
  ),
}));

const puck: PuckContext = {
  renderDropZone: () => null,
  isEditing: false,
  dragRef: null,
  metadata: {},
};

const yearly = mockMemberPlan({ id: 'yearly', name: 'Yearly' });
const monthly = mockMemberPlan({ id: 'monthly', name: 'Monthly' });
const student = mockMemberPlan({ id: 'student', name: 'Student' });

const memberPlanListQuery = mockOperation(MemberPlanListDocument, {
  variables: { take: 100, filter: { active: true } },
  data: {
    __typename: 'Query',
    memberPlans: mockPaginated('PaginatedMemberPlans', [
      yearly,
      monthly,
      student,
    ]),
  },
});

const renderSubscribe = (datasources?: DatasourcesValue) =>
  renderWithProviders(
    createElement(SubscribeRender, {
      ...SubscribeConfig.defaultProps,
      id: 'Subscribe-1',
      puck,
      datasources,
    } as Parameters<typeof SubscribeRender>[0]),
    { mocks: [memberPlanListQuery] }
  );

const renderSubscribeInsideForm = (isEditing: boolean) =>
  renderWithProviders(
    <FormContext.Provider value={{ id: 'Form-1' }}>
      {createElement(SubscribeRender, {
        ...SubscribeConfig.defaultProps,
        id: 'Subscribe-1',
        puck: { ...puck, isEditing },
      } as Parameters<typeof SubscribeRender>[0])}
    </FormContext.Provider>
  );

const nestedFormWarning =
  'This block has its own form and cannot be placed inside a Form';

const offeredPlans = async () =>
  within(await screen.findByRole('list', { name: 'Offered plans' }))
    .findAllByRole('listitem')
    .then(items => items.map(item => item.textContent));

describe('selectMemberPlans', () => {
  it('offers every plan when the editor picked none', () => {
    const plans = [yearly, monthly];

    expect(selectMemberPlans(plans, [])).toBe(plans);
  });

  it('keeps the order the editor picked and skips unknown plans', () => {
    expect(
      selectMemberPlans(
        [yearly, monthly, student],
        ['student', 'gone', 'yearly']
      )
    ).toEqual([student, yearly]);
  });
});

describe('Subscribe', () => {
  it('offers the picked member plans in the picked order', async () => {
    renderSubscribe({
      memberPlan: { type: 'multiple', ids: ['student', 'yearly'] },
    });

    expect(await offeredPlans()).toEqual(['Student', 'Yearly']);
  });

  it('offers every active member plan when none is picked', async () => {
    renderSubscribe({ memberPlan: { type: 'multiple', ids: [] } });

    expect(await offeredPlans()).toEqual(['Yearly', 'Monthly', 'Student']);
  });

  it('lets editors pick the member plans through the datasource field', () => {
    expect(SubscribeConfig.fields?.datasources).toMatchObject({
      type: 'datasource',
      models: ['memberPlan'],
      types: ['multiple'],
      label: 'Member plans',
    });
    expect(SubscribeConfig.defaultProps?.datasources).toEqual({
      memberPlan: { type: 'multiple', ids: [] },
    });
  });

  it('warns in the editor instead of nesting its form inside a Form', () => {
    renderSubscribeInsideForm(true);

    expect(screen.getByText(nestedFormWarning)).toBeTruthy();
    expect(screen.queryByRole('list', { name: 'Offered plans' })).toBeNull();
  });

  it('renders nothing inside a Form on the website', () => {
    const { container } = renderSubscribeInsideForm(false);

    expect(container.textContent).toBe('');
    expect(screen.queryByRole('list', { name: 'Offered plans' })).toBeNull();
  });

  it('keeps the picked member plans while resolving', async () => {
    const props = {
      ...SubscribeConfig.defaultProps,
      id: 'Subscribe-1',
      datasources: {
        memberPlan: { type: 'multiple' as const, ids: ['student'] },
      },
    };
    const resolved = await SubscribeConfig.resolveData?.(
      { props } as Parameters<
        NonNullable<typeof SubscribeConfig.resolveData>
      >[0],
      {} as Parameters<NonNullable<typeof SubscribeConfig.resolveData>>[1]
    );

    expect({ ...props, ...resolved?.props }.datasources).toEqual({
      memberPlan: { type: 'multiple', ids: ['student'] },
    });
  });
});
