import {
  EventContentInput,
  EventInput,
  UpdateEventInput,
} from '@wepublish/editor/api';

import {
  CONTENT_FIELDS,
  EventFormValues,
  FACT_FIELDS,
} from '../event-form-schema';
import {
  changedAltTexts,
  changedFactInput,
  eventContentInput,
  eventCreateInput,
  EventImageAltText,
  isContentChanged,
} from './event-form-mapping';

export type EventSaveGroup = 'facts' | 'content' | 'altText';

export type EventSaveFailure = { group: EventSaveGroup; message: string };

export type EventSaveResult = {
  id: string | undefined;
  saved: EventSaveGroup[];
  failed: EventSaveFailure[];
};

export type EventSaveMutations = {
  createEvent(input: EventInput, content: EventContentInput): Promise<string>;
  updateEvent(id: string, input: UpdateEventInput): Promise<unknown>;
  updateEventContent(id: string, input: EventContentInput): Promise<unknown>;
  updateImageAltText(image: EventImageAltText): Promise<unknown>;
};

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const saveAltTexts = async (
  altTexts: EventImageAltText[],
  mutations: EventSaveMutations
) => {
  for (const altText of altTexts) {
    await mutations.updateImageAltText(altText);
  }
};

export async function saveEvent({
  id,
  defaults,
  values,
  mutations,
}: {
  id: string | undefined;
  defaults: EventFormValues;
  values: EventFormValues;
  mutations: EventSaveMutations;
}): Promise<EventSaveResult> {
  const saved: EventSaveGroup[] = [];
  const failed: EventSaveFailure[] = [];
  const altTexts = changedAltTexts(defaults, values);

  const attempt = async (
    group: EventSaveGroup,
    run: () => Promise<unknown>
  ) => {
    try {
      await run();
      saved.push(group);
    } catch (error) {
      failed.push({ group, message: messageOf(error) });
    }
  };

  if (!id) {
    let createdId: string | undefined;

    try {
      createdId = await mutations.createEvent(
        eventCreateInput(values),
        eventContentInput(values)
      );
      saved.push('facts', 'content');
    } catch (error) {
      const message = messageOf(error);

      return {
        id: undefined,
        saved,
        failed: [
          { group: 'facts', message },
          { group: 'content', message },
        ],
      };
    }

    if (altTexts.length) {
      await attempt('altText', () => saveAltTexts(altTexts, mutations));
    }

    return { id: createdId, saved, failed };
  }

  const facts = changedFactInput(defaults, values);

  if (Object.keys(facts).length) {
    await attempt('facts', () => mutations.updateEvent(id, facts));
  }

  if (isContentChanged(defaults, values)) {
    await attempt('content', () =>
      mutations.updateEventContent(id, eventContentInput(values))
    );
  }

  if (altTexts.length) {
    await attempt('altText', () => saveAltTexts(altTexts, mutations));
  }

  return { id, saved, failed };
}

const altTextOf = (defaults: EventFormValues, imageId: string) =>
  defaults.images.find(({ value }) => value.image.id === imageId)?.value
    .altText;

const pick = <K extends keyof EventFormValues>(
  fields: readonly K[],
  source: EventFormValues
) =>
  Object.fromEntries(fields.map(field => [field, source[field]])) as Pick<
    EventFormValues,
    K
  >;

export const defaultsAfterSave = (
  defaults: EventFormValues,
  values: EventFormValues,
  saved: EventSaveGroup[]
): EventFormValues => {
  const next: EventFormValues = {
    ...defaults,
    ...(saved.includes('facts') ? pick(FACT_FIELDS, values) : {}),
    ...(saved.includes('content') ? pick(CONTENT_FIELDS, values) : {}),
  };

  return {
    ...next,
    images: next.images.map(row => {
      const altText =
        saved.includes('altText') ?
          values.images.find(
            ({ value }) => value.image.id === row.value.image.id
          )?.value.altText
        : (altTextOf(defaults, row.value.image.id) ??
          row.value.image.description ??
          '');

      return { ...row, value: { ...row.value, altText: altText ?? '' } };
    }),
  };
};
