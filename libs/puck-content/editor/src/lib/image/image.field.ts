import {
  BaseField,
  ComponentData,
  PuckAction,
  PuckApi,
} from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';

/**
 * The id of an image in the image library.
 */
export type ImageValue = string;

/**
 * Picks an image from the library or uploads a new one. The value is the id
 * of the image only, components resolve it themselves.
 *
 * @example
 * image: {
 *   type: 'image',
 *   label: 'Image',
 * }
 */
export type ImageField = BaseField & {
  type: 'image';
};

export const imageSchema = z
  .string()
  .describe(
    'The id of an existing image in the image library. Keep the existing value and never invent one.'
  );

export const imageFieldAi: FieldAiParams = {
  instructions:
    'The id of an existing image in the image library. Keep the existing value and never invent one.',
  schema: toAiSchema(imageSchema),
};

export const canAddImages = (ids: ImageValue[], max?: number) =>
  max === undefined || ids.length < max;

export const appendImageIds = (
  ids: ImageValue[],
  added: ImageValue[],
  max?: number
) =>
  added.reduce(
    (current, id) =>
      current.includes(id) || !canAddImages(current, max) ?
        current
      : [...current, id],
    ids
  );

export const removeImageIdAt = (ids: ImageValue[], index: number) =>
  ids.filter((_, position) => position !== index);

export const moveImageId = (ids: ImageValue[], from: number, to: number) => {
  const moved = removeImageIdAt(ids, from);
  moved.splice(to, 0, ids[from]);

  return moved;
};

export const imageSortKeys = (ids: ImageValue[]) => {
  const seen = new Map<ImageValue, number>();

  return ids.map(id => {
    const occurrence = (seen.get(id) ?? 0) + 1;
    seen.set(id, occurrence);

    return occurrence === 1 ? id : `${id}#${occurrence}`;
  });
};

export type ImageListTarget = {
  read: (props: ComponentData['props']) => ImageValue[] | undefined;
  write: (
    props: ComponentData['props'],
    ids: ImageValue[]
  ) => ComponentData['props'];
};

export type ImageListItems = Pick<PuckApi, 'getItemById' | 'getSelectorForId'>;

export const attachUploadedImage = (
  items: ImageListItems,
  itemId: string,
  target: ImageListTarget,
  imageId: ImageValue,
  max?: number
): PuckAction | undefined => {
  const item = items.getItemById(itemId);
  const selector = items.getSelectorForId(itemId);
  const ids = item && target.read(item.props);

  if (!item || !selector || !ids) {
    return undefined;
  }

  return {
    type: 'replace',
    destinationIndex: selector.index,
    destinationZone: selector.zone,
    data: {
      ...item,
      props: target.write(item.props, appendImageIds(ids, [imageId], max)),
    },
  };
};
