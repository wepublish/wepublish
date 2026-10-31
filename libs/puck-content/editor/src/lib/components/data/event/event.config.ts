import { ComponentConfig } from '@puckeditor/core';
import { z } from 'zod/v4';
import { EventConfigProps, EventRender } from '@wepublish/puck-content/website';

import { toAiSchema } from '../../../ai-schema';
import { editorRender } from '../../../blocks/editor-render';
import {
  WithDataSource,
  withDataSource,
} from '../../../blocks/with-datasource';
import { isRecord } from '../../../document/graphql-values';
import { UserFields } from '../../../fields';

export const MIN_EVENT_COUNT = 1;
export const MAX_EVENT_COUNT = 50;
export const DEFAULT_EVENT_COUNT = 6;

const eventListTypes: readonly unknown[] = ['list', 'uniqueList'];

const listsEvents = (datasources: unknown) =>
  isRecord(datasources) &&
  isRecord(datasources['event']) &&
  eventListTypes.includes(datasources['event']['type']);

export const eventConsumes = ({
  count,
  datasources,
}: Record<string, unknown>) => {
  if (!listsEvents(datasources)) {
    return undefined;
  }

  return typeof count === 'number' && Number.isFinite(count) ?
      Math.min(MAX_EVENT_COUNT, Math.max(MIN_EVENT_COUNT, Math.round(count)))
    : DEFAULT_EVENT_COUNT;
};

const eventConfig = withDataSource<EventConfigProps>(
  {
    ai: {
      instructions: `Shows events with date, location and a short description. The events come from the event datasource: with list, the next upcoming events, as many as count says (${MIN_EVENT_COUNT} to ${MAX_EVENT_COUNT}, ${DEFAULT_EVENT_COUNT} unless the user asks for another number); with multiple, the events picked by id, in that order, and count is ignored. Keep picked event ids and never invent them.`,
    },
    fields: {
      count: {
        type: 'number',
        label: 'Number of events',
        min: MIN_EVENT_COUNT,
        max: MAX_EVENT_COUNT,
        ai: {
          instructions:
            'How many upcoming events the list shows. Only used when the event datasource is a list.',
          schema: toAiSchema(
            z
              .number()
              .int()
              .min(MIN_EVENT_COUNT)
              .max(MAX_EVENT_COUNT)
              .describe('Number of upcoming events the list shows')
          ),
        },
      },
    },
    defaultProps: {
      count: DEFAULT_EVENT_COUNT,
    },

    render: editorRender(EventRender),
  },
  { event: { type: 'list' } },
  { models: ['event'], types: ['list', 'multiple'], label: 'Events' }
);

export const EventConfig: ComponentConfig<{
  props: WithDataSource<EventConfigProps>;
  fields: UserFields;
}> = {
  ...eventConfig,
  resolveFields: ({ props }, { fields }) => {
    if (listsEvents(props.datasources)) {
      return fields;
    }

    const { count: _count, ...rest } = fields;

    return rest;
  },
};
