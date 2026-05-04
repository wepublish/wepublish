import { css } from '@emotion/react';
import { capitalize, Link, Typography, useTheme } from '@mui/material';
import { BlockFormat, InlineFormat } from '@wepublish/richtext';
import { RenderElement } from '@wepublish/richtext/website';
import { ListItemProps, UnorderedListProps } from '@wepublish/ui';
import {
  BuilderRenderElementProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { ComponentType, ReactNode } from 'react';
import { Descendant } from 'slate';

import { ReflektRenderRichtextType } from './reflekt-render-richtext';

type ReflektUnorderedListType = ComponentType<
  UnorderedListProps & { variant?: string }
>;
type ReflektListItemType = ComponentType<ListItemProps & { variant?: string }>;

const lastChildNoGutter = css`
  &&:first-child {
    padding-top: 0;
  }

  &&:last-child {
    margin-bottom: 0;
  }
`;

export const createIdFromText = (descendants: Descendant[]) =>
  descendants
    .filter(child => 'text' in child)
    .map(child => child.text)
    .join(' ')
    .toLowerCase()
    .replace(/^/, 'id-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export function ReflektRenderElement({
  element,
  variant,
}: BuilderRenderElementProps & { variant?: string }): ReactNode {
  const {
    elements: { H3, H4, H5, UnorderedList, ListItem },
    richtext: { RenderRichtext },
  } = useWebsiteBuilder();

  const ReflektRenderRichtext = RenderRichtext as ReflektRenderRichtextType;
  const ReflektUnorderedList = UnorderedList as ReflektUnorderedListType;
  const ReflektListItem = ListItem as ReflektListItemType;
  const theme = useTheme();

  switch (element.type) {
    case BlockFormat.H1:
      return (
        <H3
          component="h2"
          gutterBottom={false}
          css={lastChildNoGutter}
          id={createIdFromText(element.children)}
        >
          <RenderRichtext elements={element.children} />
        </H3>
      );

    case BlockFormat.H2:
      return (
        <H4
          component="h3"
          gutterBottom={false}
          css={lastChildNoGutter}
          id={createIdFromText(element.children)}
        >
          <RenderRichtext elements={element.children} />
        </H4>
      );

    case BlockFormat.H3:
      return (
        <H5
          component="h4"
          gutterBottom={false}
          css={lastChildNoGutter}
          id={createIdFromText(element.children)}
        >
          <RenderRichtext elements={element.children} />
        </H5>
      );
    case BlockFormat.UnorderedList:
      return (
        <ReflektUnorderedList
          css={lastChildNoGutter}
          variant={variant}
        >
          <ReflektRenderRichtext
            elements={element.children}
            variant={variant}
          />
        </ReflektUnorderedList>
      );

    case BlockFormat.ListItem:
      return (
        <ReflektListItem
          css={lastChildNoGutter}
          variant={variant}
        >
          <ReflektRenderRichtext
            elements={element.children}
            variant={variant}
          />
        </ReflektListItem>
      );

    case InlineFormat.Link: {
      const id = typeof element.id === 'string' ? element.id : '';
      const isButtonLink = id.startsWith('button-link-');
      const buttonLinkVariant =
        isButtonLink ?
          id.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
        : undefined;
      const linkVariant: string | undefined =
        buttonLinkVariant ? buttonLinkVariant
        : variant ? `link${capitalize(variant)}`
        : undefined;
      const url = element.url as string;
      const href =
        !isButtonLink && element.id ?
          `${url}${url.endsWith('#') ? '' : '#'}${createIdFromText([{ text: element.id as string }])}`
        : url;

      return (
        <Link
          target={url.startsWith('#') || url.startsWith('/') ? '' : '_blank'}
          rel="noreferrer"
          id={undefined}
          href={href}
          title={element.title as string}
          data-test="link"
          variant={linkVariant as any}
        >
          <ReflektRenderRichtext
            elements={element.children}
            variant={variant}
          />
        </Link>
      );
    }

    case BlockFormat.Paragraph:
      if (variant) {
        return (
          <Typography variant={variant as any}>
            <ReflektRenderRichtext
              elements={element.children}
              variant={variant}
            />
          </Typography>
        );
      }
      return <RenderElement element={element} />;

    default: {
      return <RenderElement element={element} />;
    }
  }
}
