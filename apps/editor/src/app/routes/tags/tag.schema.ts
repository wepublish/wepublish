import {
  type CreateTagMutationVariables,
  type FullTagFragment,
  type UpdateTagMutationVariables,
  TagType,
} from '@wepublish/editor/api';
import {
  type FormDefaultValues,
  type FormOutput,
  type FormPaths,
  type FormValues,
  formFields,
} from '@wepublish/form/editor';
import { z } from 'zod/v4';

export const tagSchema = z.object({
  tag: z.string().trim().min(1).meta({ label: 'tags.overview.name' }),
  description: formFields.richText().nullish().meta({
    label: 'tags.overview.description',
    description: 'tags.overview.descriptionInfo',
  }),
  main: z.boolean().meta({
    label: 'tags.overview.markAsMain',
    description: 'tags.overview.markAsMainInfo',
  }),
  color: formFields.color({ alpha: false }).nullish().meta({
    label: 'tags.overview.color',
    description: 'tags.overview.colorInfo',
  }),
});

export const tagListPath: Record<TagType, string> = {
  [TagType.Article]: '/articles/tags',
  [TagType.Page]: '/pages/tags',
  [TagType.Comment]: '/comments/tags',
  [TagType.Event]: '/events/tags',
  [TagType.Author]: '/authors/tags',
};

export const tagPaths = (type: TagType): FormPaths => ({
  list: tagListPath[type],
  edit: id => `${tagListPath[type]}/edit/${id}`,
});

export const tagTitleParams = ({ tag }: FormValues<typeof tagSchema>) => ({
  tag: tag || '…',
});

export const fromTag = ({
  tag,
  description,
  main,
  color,
}: FullTagFragment): FormDefaultValues<typeof tagSchema> => ({
  tag: tag ?? '',
  description,
  main,
  color,
});

export const toCreateTagVariables = (
  type: TagType,
  { tag, description, main, color }: FormOutput<typeof tagSchema>
): CreateTagMutationVariables => ({
  tag,
  description: description ?? null,
  main,
  color: color || null,
  type,
});

export const toUpdateTagVariables = (
  id: string,
  { tag, description, main, color }: FormOutput<typeof tagSchema>
): UpdateTagMutationVariables => ({
  id,
  tag,
  description: description ?? null,
  main,
  color: color || null,
});
