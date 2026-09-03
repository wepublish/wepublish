export const TAG_NACHTLEBEN = 'nachtleben';
export const TAG_ARCHIVIERT = 'archiviert';

type MaybeTag = { tag?: string | null };

export const hasTag = (tags: MaybeTag[] | null | undefined, name: string) =>
  !!tags?.some(({ tag }) => tag?.toLowerCase() === name);

export const isArchived = (tags?: MaybeTag[] | null) =>
  hasTag(tags, TAG_ARCHIVIERT);

export const isNachtleben = (tags?: MaybeTag[] | null) =>
  hasTag(tags, TAG_NACHTLEBEN);
