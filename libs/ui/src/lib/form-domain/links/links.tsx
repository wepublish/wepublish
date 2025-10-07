import { ArrayInput } from '../array/array';
import { ComponentProps, useCallback } from 'react';
import { ArticleInputSchema } from '../article/article';
import * as v from 'valibot';
import { SELECT_BRANDING } from '../../form/select/select';
import { URLInputSchema } from '../../form/url/url';
import { InputComponentProps } from '@wepublish/website/form-builder';

const LINKS_BRANDING = 'links';

export enum LinkType {
  External = 'external',
  Article = 'article',
  Page = 'page',
}

const baseLinkSchema = v.object({
  // id: v.nullable(HiddenInputSchema),
  label: v.pipe(v.string(), v.title('Label')),
  type: v.pipe(v.enum(LinkType), v.brand(SELECT_BRANDING), v.title('Type')),
});

const externalLinkSchema = v.object({
  ...baseLinkSchema.entries,
  url: v.pipe(URLInputSchema, v.title('URL')),
});

const pageLinkSchema = v.object({
  ...baseLinkSchema.entries,
  pageId: v.pipe(v.string(), v.title('Page')),
});

const articleLinkSchema = v.object({
  ...baseLinkSchema.entries,
  articleId: v.pipe(ArticleInputSchema, v.title('Article')),
});

const linkSchema = v.union([
  externalLinkSchema,
  pageLinkSchema,
  articleLinkSchema,
]);

export const LinksInputSchema = v.pipe(
  v.array(linkSchema),
  v.brand(LINKS_BRANDING)
);

export function LinksInput(
  props: InputComponentProps<typeof LinksInputSchema>
) {
  const getDefaultItem = useCallback(
    () => ({ type: 'external' }) as v.InferInput<typeof linkSchema>,
    []
  );

  const getSubFormProps = useCallback(
    (link: v.InferInput<typeof linkSchema>) => ({
      schema:
        (link.type === 'article' && articleLinkSchema) ||
        (link.type === 'page' && pageLinkSchema) ||
        externalLinkSchema,
      inputProps: {
        type: {
          items: [
            { value: 'external', label: 'External' },
            { value: 'article', label: 'Article' },
            { value: 'page', label: 'Page' },
          ],
        },
      },
    }),
    []
  ) as ComponentProps<typeof ArrayInput>['getSubFormProps'];

  return (
    <ArrayInput
      {...props}
      getDefaultItem={getDefaultItem}
      getSubFormProps={getSubFormProps}
    />
  );
}
