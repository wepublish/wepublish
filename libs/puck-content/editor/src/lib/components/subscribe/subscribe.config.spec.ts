import { PuckContext } from '@puckeditor/core';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@wepublish/mocks/website';
import { FormContext } from '@wepublish/puck-content/website';
import { createElement } from 'react';

import { SubscribeConfig } from './subscribe.config';

const puckContext = (isEditing: boolean): PuckContext => ({
  renderDropZone: () => null,
  isEditing,
  dragRef: null,
  metadata: {},
});

const subscribeInsideForm = (isEditing: boolean) =>
  renderWithProviders(
    createElement(
      FormContext.Provider,
      { value: { id: 'Form-1' } },
      createElement(SubscribeConfig.render, {
        ...SubscribeConfig.defaultProps,
        id: 'Subscribe-1',
        puck: puckContext(isEditing),
      } as Parameters<typeof SubscribeConfig.render>[0])
    )
  );

const nestedFormWarning =
  'This block has its own form and cannot go inside a Form block';

describe('SubscribeConfig', () => {
  it('offers every active member plan unless editors pick some', () => {
    expect(SubscribeConfig.fields?.datasources).toMatchObject({
      type: 'datasource',
      models: ['memberPlan'],
      types: ['list', 'multiple'],
      label: 'Member plans',
    });
    expect(SubscribeConfig.defaultProps?.datasources).toEqual({
      memberPlan: { type: 'list' },
    });
  });

  it('stores no member plans in its props, they come from its data', () => {
    expect(Object.keys(SubscribeConfig.fields ?? {})).not.toEqual(
      expect.arrayContaining(['memberPlans'])
    );
    expect(SubscribeConfig.defaultProps).not.toHaveProperty('memberPlans');
    expect(SubscribeConfig.defaultProps).not.toHaveProperty('memberPlanIds');
    expect(SubscribeConfig.defaultProps).not.toHaveProperty(
      'memberPlanRenderSettings'
    );
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

  it('warns in the editor instead of nesting its form inside a Form', () => {
    subscribeInsideForm(true);

    expect(screen.getByText(nestedFormWarning)).toBeTruthy();
  });

  it('renders nothing inside a Form outside the editor', () => {
    const { container } = subscribeInsideForm(false);

    expect(container.textContent).toBe('');
  });
});
