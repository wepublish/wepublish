export const TAG_NACHTLEBEN = 'nachtleben';
export const TAG_ARCHIVIERT = 'archiviert';

type MaybeTag = { tag?: string | null };

export const isArchived = (tags?: MaybeTag[] | null) =>
  !!tags?.some(({ tag }) => tag?.toLowerCase() === TAG_ARCHIVIERT);
