import { css } from '@emotion/react';
import { Link, useTheme } from '@mui/material';
import { BlockFormat, InlineFormat } from '@wepublish/richtext';
import { RenderElement } from '@wepublish/richtext/website';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { BuilderRenderElementProps } from '@wepublish/website/builder';
import { ReactNode } from 'react';

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
    elements: { UnorderedList, ListItem },
    richtext: { RenderRichtext },
  } = useWebsiteBuilder();
  const theme = useTheme();

  switch (element.type) {
    case BlockFormat.UnorderedList:
      return (
        <UnorderedList css={lastChildNoGutter}>
          <RenderRichtext elements={element.children} />
        </UnorderedList>
      );

    case BlockFormat.ListItem:
      return (
        <ListItem css={lastChildNoGutter}>
          <RenderRichtext elements={element.children} />
        </ListItem>
      );

    case InlineFormat.Link:
      return (
        <Link
          target={
            (
              (element.url as string).startsWith('#') ||
              (element.url as string).startsWith('/')
            ) ?
              ''
            : '_blank'
          }
          rel="noreferrer"
          id={element.id as string}
          href={element.url as string}
          title={element.title as string}
          data-test="link"
        >
          <RenderRichtext elements={element.children} />
        </Link>
      );

    default: {
      return <RenderElement element={element} />;
    }
  }
}
