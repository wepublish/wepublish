import {
  type FullNavigationFragment,
  type NavigationLinkInput,
  NavigationLinkType,
} from '@wepublish/editor/api';
import {
  type FormDefaultValues,
  type FormOutput,
  formFields,
} from '@wepublish/form/editor';
import { z } from 'zod/v4';

const linkLabel = z
  .string()
  .trim()
  .min(1)
  .meta({ label: 'navigation.panels.label' });

export const navigationLinkSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(NavigationLinkType.External).meta({
      label: 'navigation.panels.linkType',
      optionLabelPrefix: 'navigation.panels.linkTypes.',
    }),
    label: linkLabel,
    url: z.string().trim().min(1).meta({ label: 'navigation.panels.url' }),
  }),
  z.object({
    type: z.literal(NavigationLinkType.Page),
    label: linkLabel,
    pageID: formFields.page().meta({
      label: 'navigation.panels.linkTypePage',
      placeholder: 'navigation.panels.selectPage',
    }),
  }),
  z.object({
    type: z.literal(NavigationLinkType.Article),
    label: linkLabel,
    articleID: formFields.article().meta({
      label: 'navigation.panels.linkTypeArticle',
      placeholder: 'navigation.panels.selectArticle',
    }),
  }),
]);

export const navigationSchema = z.object({
  name: z.string().trim().min(1).meta({ label: 'navigation.panels.name' }),
  key: z.string().trim().min(1).meta({
    label: 'navigation.panels.key',
    description: 'navigation.panels.keyInfo',
  }),
  links: z
    .array(navigationLinkSchema)
    .meta({ label: 'navigation.panels.links' }),
});

type StoredLink = FullNavigationFragment['links'][number];

type NavigationLinkValues = z.output<typeof navigationLinkSchema>;

const fromLink = (link: StoredLink): NavigationLinkValues => {
  switch (link.__typename) {
    case 'ArticleNavigationLink':
      return {
        type: NavigationLinkType.Article,
        label: link.label,
        articleID: link.articleID,
      };
    case 'PageNavigationLink':
      return {
        type: NavigationLinkType.Page,
        label: link.label,
        pageID: link.pageID,
      };
    case 'ExternalNavigationLink':
      return {
        type: NavigationLinkType.External,
        label: link.label,
        url: link.url ?? '',
      };
  }
};

export const fromNavigation = ({
  name,
  key,
  links,
}: FullNavigationFragment): FormDefaultValues<typeof navigationSchema> => ({
  name,
  key,
  links: links.map(fromLink),
});

export const toNavigationVariables = ({
  name,
  key,
  links,
}: FormOutput<typeof navigationSchema>): {
  name: string;
  key: string;
  links: NavigationLinkInput[];
} => ({ name, key, links });
