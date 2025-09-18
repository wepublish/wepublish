import { useWebsiteBuilder } from '@wepublish/website/builder';
import { BuilderRenderElementProps } from '@wepublish/website/builder';
import { Link, Theme, useTheme } from '@mui/material';
import { BlockFormat, InlineFormat } from '@wepublish/richtext';
import { css } from '@emotion/react';
import { ReactNode } from 'react';

const tableStyles = css`
  border-collapse: collapse;
`;

const tableCellStyles = (theme: Theme, borderColor?: string) => css`
  border-collapse: collapse;
  border: 1px solid ${borderColor ?? 'transparent'};
  padding: ${theme.spacing(1)};
`;

const lastChildNoGutter = css`
  &&:first-child {
    padding-top: 0;
  }

  &&:last-child {
    margin-bottom: 0;
  }
`;

export function RenderElement({
  element,
}: BuilderRenderElementProps): ReactNode {
  const {
    elements: { H3, H4, H5, Paragraph, UnorderedList, OrderedList, ListItem },
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
        <UnorderedList css={lastChildNoGutter}>
          <RenderRichtext elements={element.children} />
        </UnorderedList>
      );

    case BlockFormat.OrderedList:
      return (
        <OrderedList css={lastChildNoGutter}>
          <RenderRichtext elements={element.children} />
        </OrderedList>
      );

    case BlockFormat.ListItem:
      return (
        <ListItem css={lastChildNoGutter}>
          <RenderRichtext elements={element.children} />
        </ListItem>
      );

    case BlockFormat.Table:
      return (
        <table css={tableStyles}>
          <tbody>
            <RenderRichtext elements={element.children} />
          </tbody>
        </table>
      );

    case BlockFormat.TableRow:
      return (
        <tr>
          <RenderRichtext elements={element.children} />
        </tr>
      );

    case BlockFormat.TableCell:
      return (
        <td css={tableCellStyles(theme, element.borderColor as string)}>
          <RenderRichtext elements={element.children} />
        </td>
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
        >
          <RenderRichtext elements={element.children} />
        </Link>
      );

    default: {
      if (
        element.children.length === 1 &&
        'text' in element.children[0] &&
        !element.children[0].text
      ) {
        return undefined;
      }

      return (
        <Paragraph css={lastChildNoGutter}>
          <RenderRichtext elements={element.children} />
        </Paragraph>
      );
    }
  }
}
