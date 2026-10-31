import { DatasourcesValue } from '@wepublish/puck-content/editor';
import { createElement } from 'react';

import { withDataSource, WithDataSource } from './with-datasource';

type PlanProps = WithDataSource<{ title: string; plans: string[] }>;

const resolveParams = {
  changed: {},
  lastData: null,
  metadata: {},
  trigger: 'replace',
  parent: null,
  root: {},
} as const;

const PlanBlock = withDataSource<PlanProps>(
  {
    fields: {
      title: { type: 'text' },
      plans: { type: 'resolved', visible: false },
    },
    defaultProps: { title: 'Plans', plans: [] },
    resolveData: () => ({ props: { plans: [] } }),
    render: ({ title }) => createElement('h2', null, title),
  },
  { memberPlan: { type: 'multiple', ids: [] } },
  { models: ['memberPlan'], types: ['multiple'], label: 'Member plans' }
);

const resolveLikePuck = async (props: PlanProps) => {
  const data = { props: { id: 'Plans-1', ...props } };
  const resolved = await PlanBlock.resolveData?.(data, resolveParams);

  return { ...data.props, ...resolved?.props };
};

describe('withDataSource', () => {
  it('declares the datasources field without resolving fields', () => {
    expect(PlanBlock.fields?.['datasources']).toMatchObject({
      type: 'datasource',
      models: ['memberPlan'],
      types: ['multiple'],
      label: 'Member plans',
      ai: { instructions: expect.stringContaining('memberPlan') },
    });
    expect(PlanBlock.fields?.['title']).toEqual({ type: 'text' });
  });

  it('starts new blocks with the default datasources', () => {
    expect(PlanBlock.defaultProps).toEqual({
      title: 'Plans',
      plans: [],
      datasources: { memberPlan: { type: 'multiple', ids: [] } },
    });
  });

  it('keeps the selection when the wrapped resolveData returns some props', async () => {
    const datasources: DatasourcesValue = {
      memberPlan: { type: 'multiple', ids: ['m1', 'm2'] },
    };

    const props = await resolveLikePuck({
      title: 'Plans',
      plans: ['stale'],
      datasources,
    });

    expect(props.datasources).toEqual(datasources);
    expect(props.plans).toEqual([]);
  });

  it('leaves the props alone when nothing needs resolving', () => {
    const Plain = withDataSource<WithDataSource<{ title: string }>>({
      fields: { title: { type: 'text' } },
      render: ({ title }) => createElement('h2', null, title),
    });

    expect(Plain.resolveData).toBeUndefined();
    expect(Plain.defaultProps).toBeUndefined();
    expect(Plain.fields?.['datasources']).toMatchObject({
      type: 'datasource',
    });
  });
});
