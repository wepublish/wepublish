import { css } from '@emotion/react';
import { Typography } from '@mui/material';
import { RichtextElements } from '@wepublish/richtext';
import { RenderElement } from '@wepublish/richtext/website';
import { ListItemProps, UnorderedListProps } from '@wepublish/ui';
import { slugify } from '@wepublish/utils';
import {
  BuilderRenderElementProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { ComponentType, ReactNode, useContext, useMemo } from 'react';

import { RichtextVariantContext } from './reflekt-richtext-variant-context';

const nodeText = (node: RichtextElements): string => {
  if (node.type === 'text') {
    return node.text ?? '';
  }
  return (
    (node.content as RichtextElements[] | undefined)?.map(nodeText).join('') ??
    ''
  );
};

const headingId = (element: RichtextElements & { type: 'heading' }) => {
  if (element.attrs.id) {
    return element.attrs.id;
  }
  const text = nodeText(element);
  return text ? slugify(text) : undefined;
};

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

export function ReflektRenderElement({
  element,
}: BuilderRenderElementProps): ReactNode {
  const {
    elements: { H3, H4, H5, H6, UnorderedList, ListItem },
    richtext: { RenderElement: RenderElementOverride },
  } = useWebsiteBuilder();

  const variant = useContext(RichtextVariantContext);
  const ReflektUnorderedList = UnorderedList as ReflektUnorderedListType;
  const ReflektListItem = ListItem as ReflektListItemType;

  const children = useMemo(
    () =>
      (element.content as RichtextElements[] | undefined)?.map(
        (child, index) => (
          <RenderElementOverride
            key={index}
            element={child}
          />
        )
      ),
    [RenderElementOverride, element.content]
  );

  switch (element.type) {
    case 'heading': {
      const id = headingId(element);
      const level = element.attrs.level ?? 1;

      if (level <= 3) {
        return (
          <H3
            component="h2"
            gutterBottom={false}
            css={lastChildNoGutter}
            id={id}
          >
            {children}
          </H3>
        );
      }

      if (level === 4) {
        return (
          <H4
            component="h3"
            gutterBottom={false}
            css={lastChildNoGutter}
            id={id}
          >
            {children}
          </H4>
        );
      }

      if (level === 5) {
        return (
          <H5
            component="h4"
            gutterBottom={false}
            css={lastChildNoGutter}
            id={id}
          >
            {children}
          </H5>
        );
      }

      return (
        <H6
          component="h5"
          gutterBottom={false}
          css={lastChildNoGutter}
          id={id}
        >
          {children}
        </H6>
      );
    }

    case 'bulletList':
      return (
        <ReflektUnorderedList
          css={lastChildNoGutter}
          variant={variant}
        >
          {children}
        </ReflektUnorderedList>
      );

    case 'listItem':
      return (
        <ReflektListItem
          css={lastChildNoGutter}
          variant={variant}
        >
          {children}
        </ReflektListItem>
      );

    case 'paragraph':
      if (variant) {
        return <Typography variant={variant as any}>{children}</Typography>;
      }
      return <RenderElement element={element} />;

    default:
      return <RenderElement element={element} />;
  }
}
