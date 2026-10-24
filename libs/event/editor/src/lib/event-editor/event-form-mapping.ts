import {
  EditorEventFragment,
  EventContentInput,
  EventInput,
  UpdateEventInput,
} from '@wepublish/editor/api';
import {
  blockForQueryBlock,
  mapBlockValueToBlockInput,
} from '@wepublish/ui/editor';
import nanoid from 'nanoid';
import { equals } from 'ramda';

import { emptyEventForm, EventFormValues } from '../event-form-schema';
import { userDisplayName } from '../facts/event-owner-field';
import { eventImagesInput, imageRefOf } from '../images/event-images-field';
import {
  scheduleFormFromEvent,
  scheduleInputFromForm,
} from '../schedule/schedule-form';

const blankToNull = (value: string) => value.trim() || null;

const bySortOrder = <T extends { sortOrder: number }>(items: T[]) =>
  [...items].sort((a, b) => a.sortOrder - b.sortOrder);

export const eventFormFromEvent = (
  event: EditorEventFragment
): EventFormValues => ({
  ...emptyEventForm(),
  name: event.latest?.name ?? '',
  printDescription: event.latest?.printDescription ?? '',
  blocks: (event.latest?.blocks ?? []).map(blockForQueryBlock),
  images: bySortOrder(event.latest?.images ?? []).flatMap(
    ({ image, caption, isMain }) =>
      image ?
        [
          {
            id: nanoid(),
            value: {
              image: imageRefOf(image),
              caption: caption ?? '',
              altText: image.description ?? '',
              isMain,
            },
          },
        ]
      : []
  ),
  status: event.status,
  organization:
    event.organization ?
      { id: event.organization.id, name: event.organization.name }
    : null,
  owner:
    event.owner ?
      { id: event.owner.id, name: userDisplayName(event.owner) }
    : null,
  place:
    event.place ?
      {
        id: event.place.id,
        name: event.place.name,
        zip: event.place.zip,
        city: event.place.city,
      }
    : null,
  tagIds: event.tags.map(({ id }) => id),
  audienceId: event.audienceId ?? null,
  schedule: scheduleFormFromEvent({
    scheduleType: event.scheduleType,
    dateFrom: event.dateFrom,
    dateTo: event.dateTo,
    weekDays: event.weekDays,
    openingTime: event.openingTime,
    dates: bySortOrder(event.dates),
  }),
  rates: bySortOrder(event.rates).map(({ id, price, designation }) => ({
    id,
    value: { price, designation: designation ?? '' },
  })),
  specialRate: event.specialRate ?? null,
  ticketingUrl: event.ticketingUrl ?? '',
  showInPrint: event.showInPrint,
  slug: event.slug ?? '',
  seoTitle: event.seoTitle ?? '',
  seoDescription: event.seoDescription ?? '',
  socialMediaTitle: event.socialMediaTitle ?? '',
  socialMediaDescription: event.socialMediaDescription ?? '',
  socialMediaImage: event.socialMediaImage ?? null,
});

const factInput = (values: EventFormValues) => ({
  status: values.status,
  organizationId: values.organization?.id ?? null,
  ownerId: values.owner?.id ?? null,
  placeId: values.place?.id ?? null,
  tagIds: values.tagIds,
  audienceId: values.audienceId,
  rates: values.rates.map(({ value }) => ({
    price: value.price.trim(),
    designation: blankToNull(value.designation),
  })),
  specialRate: values.specialRate,
  ticketingUrl: blankToNull(values.ticketingUrl),
  showInPrint: values.showInPrint,
  slug: blankToNull(values.slug),
  seoTitle: blankToNull(values.seoTitle),
  seoDescription: blankToNull(values.seoDescription),
  socialMediaTitle: blankToNull(values.socialMediaTitle),
  socialMediaDescription: blankToNull(values.socialMediaDescription),
  socialMediaImageID: values.socialMediaImage?.id ?? null,
});

type FactInput = ReturnType<typeof factInput>;

export const changedFactInput = (
  defaults: EventFormValues,
  values: EventFormValues
): UpdateEventInput => {
  const before = factInput(defaults);
  const after = factInput(values);
  const changed = Object.fromEntries(
    (Object.keys(after) as (keyof FactInput)[])
      .filter(key => !equals(before[key], after[key]))
      .map(key => [key, after[key]])
  ) as UpdateEventInput;

  const schedule = scheduleInputFromForm(values.schedule);

  return equals(scheduleInputFromForm(defaults.schedule), schedule) ? changed
    : { ...changed, ...schedule };
};

export const eventCreateInput = (values: EventFormValues): EventInput => ({
  ...factInput(values),
  ...scheduleInputFromForm(values.schedule),
  organizationId: values.organization?.id,
  ownerId: values.owner?.id,
});

export const eventContentInput = (
  values: EventFormValues
): EventContentInput => ({
  name: values.name.trim(),
  printDescription: blankToNull(values.printDescription),
  blocks: values.blocks.map(mapBlockValueToBlockInput),
  images: eventImagesInput(values.images),
});

export const isContentChanged = (
  defaults: EventFormValues,
  values: EventFormValues
) => !equals(eventContentInput(defaults), eventContentInput(values));

export type EventImageAltText = {
  id: string;
  description: string | null;
  focalPointX: number | null;
  focalPointY: number | null;
};

const savedAltText = (defaults: EventFormValues, imageId: string) =>
  defaults.images.find(({ value }) => value.image.id === imageId)?.value
    .altText;

export const changedAltTexts = (
  defaults: EventFormValues,
  values: EventFormValues
): EventImageAltText[] =>
  values.images
    .filter(({ value }) => {
      const before =
        savedAltText(defaults, value.image.id) ?? value.image.description ?? '';

      return value.altText.trim() !== before.trim();
    })
    .map(({ value }) => ({
      id: value.image.id,
      description: blankToNull(value.altText),
      focalPointX: value.image.focalPointX ?? null,
      focalPointY: value.image.focalPointY ?? null,
    }));
