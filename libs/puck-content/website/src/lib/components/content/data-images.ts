import { PuckBlockData } from '../../blocks/block.types';

export type PuckDataImage = NonNullable<PuckBlockData['images']>[number];

export const firstDataImage = (data: PuckBlockData): PuckDataImage | null =>
  data.images?.[0] ?? null;

export const dataImageById = (
  data: PuckBlockData,
  imageId: string | null | undefined
): PuckDataImage | null =>
  (imageId && data.images?.find(image => image.id === imageId)) || null;
