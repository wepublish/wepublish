import { css } from '@emotion/react';
import { capitalize, Link, useTheme } from '@mui/material';
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
  variant,
}: BuilderRenderElementProps & { variant?: string }): ReactNode {
  const {
    elements: { H3, H4, H5, UnorderedList, ListItem },
    richtext: { RenderRichtext },
  } = useWebsiteBuilder();
  const theme = useTheme();

  switch (element.type) {
    case BlockFormat.H1:
      return (
        <H3
          component="h2"
          gutterBottom
          css={lastChildNoGutter}
        >
          <RenderRichtext elements={element.children} />
        </H3>
      );

    case BlockFormat.H2:
      return (
        <H4
          component="h3"
          gutterBottom
          css={lastChildNoGutter}
        >
          <RenderRichtext elements={element.children} />
        </H4>
      );

    case BlockFormat.H3:
      return (
        <H5
          component="h4"
          gutterBottom
          css={lastChildNoGutter}
        >
          <RenderRichtext elements={element.children} />
        </H5>
      );
    case BlockFormat.UnorderedList:
      return (
        <UnorderedList
          css={lastChildNoGutter}
          variant={variant}
        >
          <RenderRichtext
            elements={element.children}
            variant={variant}
          />
        </UnorderedList>
      );

    case BlockFormat.ListItem:
      return (
        <ListItem
          css={lastChildNoGutter}
          variant={variant}
        >
          <RenderRichtext
            elements={element.children}
            variant={variant}
          />
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
          variant={variant ? `link${capitalize(variant)}` : undefined}
        >
          <RenderRichtext
            elements={element.children}
            variant={variant}
          />
        </Link>
      );

    default: {
      return <RenderElement element={element} />;
    }
  }
}
