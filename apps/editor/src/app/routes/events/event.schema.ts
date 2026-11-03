import {
  type CreateEventMutationVariables,
  type FullEventFragment,
  type UpdateEventMutationVariables,
  EventStatus,
  TagType,
} from '@wepublish/editor/api';
import {
  type FormDefaultValues,
  crossField,
  formFields,
} from '@wepublish/form/editor';
import { z } from 'zod/v4';

const eventStatuses = [
  EventStatus.Scheduled,
  EventStatus.Cancelled,
  EventStatus.Postponed,
  EventStatus.Rescheduled,
] as const;

const eventFields = z.object({
  name: z.string().min(1).meta({ label: 'event.form.name' }),
  externalSourceName: z
    .string()
    .nullish()
    .meta({ label: 'event.form.externalSource' }),
  location: z.string().nullish().meta({ label: 'event.form.location' }),
  startsAt: formFields.dateTime().meta({ label: 'event.form.startsAt' }),
  endsAt: formFields.dateTime().nullish().meta({ label: 'event.form.endsAt' }),
  lead: formFields.textarea().nullish().meta({ label: 'event.form.lead' }),
  description: formFields
    .richText()
    .nullish()
    .meta({ label: 'event.form.description' }),
  status: z.enum(eventStatuses).default(EventStatus.Scheduled).meta({
    label: 'event.form.status',
    description: 'event.form.statusInfo',
    optionLabelPrefix: 'event.form.statuses.',
  }),
  tagIds: formFields.tags(TagType.Event).meta({ label: 'event.form.tags' }),
  image: formFields.image().nullish().meta({ label: 'event.form.image' }),
});

export const eventSchema = crossField(
  eventFields,
  ['startsAt', 'endsAt'],
  ({ startsAt, endsAt }) => !endsAt || endsAt >= startsAt,
  { path: ['endsAt'], error: 'event.form.endsBeforeStart' }
);

export type EventFormOutput = z.output<typeof eventSchema>;

export const fromEvent = (
  event: FullEventFragment
): FormDefaultValues<typeof eventSchema> => ({
  name: event.name,
  externalSourceName: event.externalSourceName,
  location: event.location,
  startsAt: new Date(event.startsAt),
  endsAt: event.endsAt ? new Date(event.endsAt) : null,
  lead: event.lead,
  description: event.description,
  status: event.status,
  tagIds: event.tags?.map(tag => tag.id) ?? [],
  image: event.image,
});

const toEventInput = ({
  name,
  location,
  startsAt,
  endsAt,
  lead,
  description,
  tagIds,
  image,
}: EventFormOutput) => ({
  name,
  location: location || null,
  startsAt: startsAt.toISOString(),
  endsAt: endsAt?.toISOString() ?? null,
  lead: lead || null,
  description: description ?? null,
  tagIds,
  imageId: image?.id ?? null,
});

export const toCreateEventVariables = (
  values: EventFormOutput
): CreateEventMutationVariables => toEventInput(values);

export const toUpdateEventVariables = (
  id: string,
  values: EventFormOutput
): UpdateEventMutationVariables => ({
  id,
  ...toEventInput(values),
  status: values.status,
});
