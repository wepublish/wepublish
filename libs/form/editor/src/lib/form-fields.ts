import type {
  FullImageFragment,
  FullUserFragment,
  TagType,
} from '@wepublish/editor/api';
import { withKind } from '@wepublish/form/core';
import type { RichtextJSONDocument } from '@wepublish/richtext';
import type { UserSearchValue } from '@wepublish/ui/editor';
import { z } from 'zod/v4';

import {
  colorError,
  type ColorKindParams,
  colorPattern,
} from './fields/color-format';

const isPresent = (value: unknown) => value !== null && value !== undefined;

export const formFields = {
  textarea: () => withKind(z.string(), 'textarea'),
  switch: () => withKind(z.boolean(), 'switch'),
  radio: <S extends z.ZodEnum>(schema: S) => withKind(schema, 'radio'),
  image: <T extends { id: string } = FullImageFragment>() =>
    withKind(
      z.custom<T>(isPresent, { error: 'form.errors.required' }),
      'image'
    ),
  tags: (tagType: TagType) =>
    withKind(z.array(z.string()), 'tags', { tagType }),
  page: () => withKind(z.string().min(1), 'page'),
  pages: () => withKind(z.array(z.string()), 'pages'),
  article: () => withKind(z.string().min(1), 'article'),
  paywall: () => withKind(z.string().min(1), 'paywall'),
  memberPlan: () => withKind(z.string().min(1), 'memberPlan'),
  memberPlans: () => withKind(z.array(z.string()), 'memberPlans'),
  user: <T extends UserSearchValue = FullUserFragment>() =>
    withKind(z.custom<T>(isPresent, { error: 'form.errors.required' }), 'user'),
  dateTime: () => withKind(z.date(), 'dateTime'),
  secret: () =>
    withKind(
      z
        .string()
        .nullish()
        .transform(value => value || undefined),
      'secret'
    ),
  color: (params?: ColorKindParams) =>
    withKind(
      z.string().regex(colorPattern(params), { error: colorError }),
      'color',
      params ?? {}
    ),
  entity: <T extends object>() =>
    withKind(
      z.custom<T>(isPresent, { error: 'form.errors.required' }),
      'entity'
    ),
  richText: <T = RichtextJSONDocument>() =>
    withKind(
      z.custom<T>(isPresent, { error: 'form.errors.required' }),
      'richText'
    ),
};
