import { PuckContext } from '@puckeditor/core';
import { screen } from '@testing-library/react';
import { mockEvent, renderWithProviders } from '@wepublish/mocks/website';
import {
  emptyPuckBlockData,
  PuckBlockData,
} from '@wepublish/puck-content/website';
import { createElement } from 'react';

import { PuckBlockDataContext } from '../../../block-data/puck-block-data.context';
import { EventConfig, eventConsumes } from './event.config';

const puck: PuckContext = {
  renderDropZone: () => null,
  isEditing: true,
  dragRef: null,
  metadata: {},
};

const renderEvent = (data: ReadonlyMap<string, PuckBlockData>) =>
  renderWithProviders(
    <PuckBlockDataContext.Provider value={data}>
      {createElement(EventConfig.render, {
        id: 'Event-1',
        puck,
        datasources: { event: { type: 'list' } },
      })}
    </PuckBlockDataContext.Provider>
  );

describe('EventConfig', () => {
  it('lets editors show the upcoming events or pick events', () => {
    expect(EventConfig.fields?.datasources).toMatchObject({
      type: 'datasource',
      models: ['event'],
      types: ['list', 'multiple'],
      label: 'Events',
    });
    expect(EventConfig.defaultProps?.datasources).toEqual({
      event: { type: 'list' },
    });
  });

  it('lets editors choose how many upcoming events the block lists', () => {
    expect(EventConfig.fields?.count).toMatchObject({
      type: 'number',
      label: 'Number of events',
      min: 1,
      max: 50,
    });
    expect(EventConfig.defaultProps?.count).toBe(6);
  });

  it('lets the AI choose between 1 and 50 events for the list', () => {
    expect(EventConfig.fields?.count?.ai?.schema).toMatchObject({
      type: 'integer',
      minimum: 1,
      maximum: 50,
    });
    expect(EventConfig.ai?.instructions).toMatch(/count/);
  });

  it.each([
    [3, 3],
    [50, 50],
    [undefined, 6],
    ['7', 6],
    [0, 1],
    [51, 50],
    [2.6, 3],
  ])('consumes %s events from its own list as %s', (count, consumed) => {
    expect(
      eventConsumes({ count, datasources: { event: { type: 'list' } } })
    ).toBe(consumed);
  });

  it('consumes the events from its own unique list', () => {
    expect(
      eventConsumes({
        count: 4,
        datasources: { event: { type: 'uniqueList' } },
      })
    ).toBe(4);
  });

  it.each([
    ['picks its events', { event: { type: 'multiple', ids: ['event-1'] } }],
    ['takes its events from the parent', { event: { type: 'slot' } }],
    ['has no event datasource', {}],
    ['has no datasources', undefined],
  ])('consumes no events when it %s', (_, datasources) => {
    expect(eventConsumes({ count: 3, datasources })).toBeUndefined();
  });

  describe('number of events field', () => {
    const resolveFields = (datasources: unknown) =>
      EventConfig.resolveFields?.(
        { props: { id: 'Event-1', count: 3, datasources } } as never,
        { fields: EventConfig.fields ?? {} } as never
      );

    it.each([
      ['the upcoming events', { event: { type: 'list' } }],
      ['unique upcoming events', { event: { type: 'uniqueList' } }],
    ])('is shown when the block lists %s', async (_, datasources) => {
      const fields = await resolveFields(datasources);

      expect(fields).toHaveProperty('count');
      expect(fields).toHaveProperty('datasources');
    });

    it.each([
      ['picks its events', { event: { type: 'multiple', ids: ['event-1'] } }],
      ['has no event datasource', {}],
    ])('is hidden when the block %s', async (_, datasources) => {
      const fields = await resolveFields(datasources);

      expect(fields).not.toHaveProperty('count');
      expect(fields).toHaveProperty('datasources');
    });
  });

  it('no longer stores the events in its props', () => {
    expect(EventConfig.fields).not.toHaveProperty('events');
    expect(EventConfig.defaultProps).not.toHaveProperty('events');
  });

  it('shows the events the preview resolved for the block', () => {
    renderEvent(
      new Map([
        [
          'Event-1',
          {
            ...emptyPuckBlockData,
            events: [
              mockEvent({ name: 'Concert' }),
              mockEvent({ name: 'Reading' }),
            ],
          },
        ],
      ])
    );

    expect(
      screen.getAllByRole('heading').map(({ textContent }) => textContent)
    ).toEqual(['Concert', 'Reading']);
  });

  it('lists no events until the preview answers', () => {
    const { container } = renderEvent(new Map());

    expect(container.childElementCount).toBe(1);
    expect(container.firstElementChild?.childElementCount).toBe(0);
  });
});
