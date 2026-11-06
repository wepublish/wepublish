import {
  type CreateAuthorMutationVariables,
  type FullAuthorFragment,
  type UpdateAuthorMutationVariables,
  TagType,
} from '@wepublish/editor/api';
import {
  type FormDefaultValues,
  type FormOutput,
  formFields,
} from '@wepublish/form/editor';
import { z } from 'zod/v4';

export const authorLinkSchema = z.object({
  title: z.string().trim().min(1).meta({ label: 'authors.panels.title' }),
  url: z.string().trim().min(1).meta({ label: 'authors.panels.link' }),
});

export const authorSchema = z.object({
  name: z.string().min(1).meta({ label: 'authors.panels.name' }),
  slug: z.string(),
  jobTitle: z.string().meta({ label: 'authors.panels.jobTitle' }),
  image: formFields.image().nullish().meta({ label: 'authors.panels.image' }),
  bio: formFields
    .richText()
    .nullish()
    .meta({ label: 'authors.panels.bioInformation' }),
  links: z.array(authorLinkSchema).meta({ label: 'authors.panels.links' }),
  tagIds: formFields
    .tags(TagType.Author)
    .meta({ label: 'authors.panels.tags' }),
  hideOnArticle: z.boolean().meta({ label: 'authorEditPanel.hideOnArticle' }),
  hideOnTeaser: z.boolean().meta({ label: 'authorEditPanel.hideOnTeaser' }),
  hideOnTeam: z.boolean().meta({ label: 'authorEditPanel.hideOnTeam' }),
});

export type AuthorFormOutput = FormOutput<typeof authorSchema>;

export const fromAuthor = (
  author: FullAuthorFragment
): FormDefaultValues<typeof authorSchema> => ({
  name: author.name,
  slug: author.slug,
  jobTitle: author.jobTitle ?? '',
  image: author.image,
  bio: author.bio,
  links: author.links.map(({ title, url }) => ({ title, url })),
  tagIds: author.tags.map(tag => tag.id),
  hideOnArticle: author.hideOnArticle,
  hideOnTeaser: author.hideOnTeaser,
  hideOnTeam: author.hideOnTeam,
});

const toAuthorInput = ({
  name,
  slug,
  jobTitle,
  links,
  tagIds,
  hideOnArticle,
  hideOnTeaser,
  hideOnTeam,
}: AuthorFormOutput) => ({
  name,
  slug,
  jobTitle,
  links,
  tagIds,
  hideOnArticle,
  hideOnTeaser,
  hideOnTeam,
});

export const toCreateAuthorVariables = (
  values: AuthorFormOutput
): CreateAuthorMutationVariables => ({
  ...toAuthorInput(values),
  bio: values.bio ?? undefined,
  imageID: values.image?.id,
});

export const toUpdateAuthorVariables = (
  id: string,
  values: AuthorFormOutput
): UpdateAuthorMutationVariables => ({
  id,
  ...toAuthorInput(values),
  bio: values.bio ?? null,
  imageID: values.image?.id ?? null,
});
