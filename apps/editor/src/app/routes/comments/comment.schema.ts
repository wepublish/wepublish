import {
  type CommentUserFragment,
  type FullCommentFragment,
  type FullCommentRatingSystemFragment,
  type UpdateCommentMutationVariables,
  TagType,
} from '@wepublish/editor/api';
import {
  type FormDefaultValues,
  type FormOutput,
  formFields,
} from '@wepublish/form/editor';
import { z } from 'zod/v4';

const ratingValue = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

const ratingOverride = z.object({
  answerId: z.string(),
  answer: z.string(),
  value: ratingValue.nullish(),
});

export const commentSchema = z.object({
  title: z.string().nullish().meta({ label: 'commentEditView.title' }),
  lead: z.string().nullish().meta({ label: 'commentEditView.lead' }),
  text: formFields
    .richText()
    .nullish()
    .meta({ label: 'commentEditView.comment' }),
  featured: z.boolean().meta({
    label: 'commentEditView.featured',
    description: 'commentEditView.featuredHelpText',
  }),
  tagIds: formFields
    .tags(TagType.Comment)
    .meta({ label: 'commentEditView.tags' }),
  source: z.string().nullish().meta({
    label: 'commentEditView.source',
    description: 'commentEditView.sourceInfo',
  }),
  user: formFields
    .user<CommentUserFragment>()
    .nullish()
    .meta({ label: 'commentUser.selectExistingUser' }),
  guestUsername: z.string().nullish().meta({ label: 'commentUser.guestUser' }),
  guestUserImage: formFields
    .image()
    .nullish()
    .meta({ label: 'commentUser.selectImage' }),
  ratingOverrides: z
    .array(ratingOverride)
    .meta({ label: 'commentEditView.ratingOverrides' }),
});

type CommentValues = FormOutput<typeof commentSchema>;

type RatingAnswer = FullCommentRatingSystemFragment['answers'][number];

const revisionKeys: readonly string[] = ['title', 'lead', 'text'];

const asRating = (value: number | null | undefined) =>
  ratingValue.safeParse(value).data ?? null;

export const fromComment = (
  comment: FullCommentFragment,
  answers: readonly RatingAnswer[]
): FormDefaultValues<typeof commentSchema> => {
  const lastRevision = comment.revisions.at(-1);

  return {
    title: lastRevision?.title,
    lead: lastRevision?.lead,
    text: lastRevision?.text,
    featured: !!comment.featured,
    tagIds: comment.tags?.map(tag => tag.id) ?? [],
    source: comment.source,
    user: comment.user,
    guestUsername: comment.guestUsername,
    guestUserImage: comment.guestUserImage,
    ratingOverrides: answers.map(answer => ({
      answerId: answer.id,
      answer: answer.answer ?? '',
      value: asRating(
        comment.overriddenRatings.find(
          override => override.answerId === answer.id
        )?.value
      ),
    })),
  };
};

const isStored = (comment: FullCommentFragment, answerId: string) =>
  comment.overriddenRatings.some(override => override.answerId === answerId);

export const toUpdateCommentVariables = (
  comment: FullCommentFragment,
  values: CommentValues,
  changedKeys: readonly string[]
): UpdateCommentMutationVariables => ({
  id: comment.id,
  revision:
    changedKeys.some(key => revisionKeys.includes(key)) ?
      { title: values.title, lead: values.lead, text: values.text }
    : undefined,
  userID: values.user?.id || null,
  guestUsername: values.guestUsername,
  guestUserImageID: values.guestUserImage?.id || null,
  source: values.source,
  tagIds: values.tagIds,
  featured: values.featured,
  ratingOverrides: values.ratingOverrides
    .filter(
      ({ answerId, value }) =>
        (value !== null && value !== undefined) || isStored(comment, answerId)
    )
    .map(({ answerId, value }) => ({ answerId, value: value ?? null })),
});
