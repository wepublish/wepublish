import {useWebsiteBuilder} from '@wepublish/website/builder'
import {BuilderRenderElementProps} from '@wepublish/website/builder'
import {Link, Theme, useTheme} from '@mui/material'
import {BlockFormat, InlineFormat} from '@wepublish/richtext'
import {css} from '@emotion/react'
import {Fragment} from 'react'

const tableStyles = css`
  border-collapse: collapse;
`

const tableCellStyles = (theme: Theme, borderColor?: string) => css`
  border-collapse: collapse;
  border: 1px solid ${borderColor ?? 'transparent'};
  padding: ${theme.spacing(1)};
`

const lastChildNoGutter = css`
  &:last-child {
    margin-bottom: 0;
  }
`

export function RenderElement({
  attributes,
  children,
  element
}: BuilderRenderElementProps): JSX.Element {
  const {
    elements: {H3, H4, H5, Paragraph, UnorderedList, OrderedList, ListItem}
  } = useWebsiteBuilder()
  const theme = useTheme()

  switch (element.type) {
    case BlockFormat.H1:
      return (
        <div>
          <H3 component="h2" {...attributes} gutterBottom>
            {children}
          </H3>

          <hr />
        </div>
      )

    case BlockFormat.H2:
      return (
        <H4 component="h3" {...attributes} gutterBottom css={lastChildNoGutter}>
          {children}
        </H4>
      )

    case BlockFormat.H3:
      return (
        <H5 component="h4" {...attributes} gutterBottom css={lastChildNoGutter}>
          {children}
        </H5>
      )

    case BlockFormat.UnorderedList:
      return <UnorderedList {...attributes}>{children}</UnorderedList>

    case BlockFormat.OrderedList:
      return <OrderedList {...attributes}>{children}</OrderedList>

    case BlockFormat.ListItem:
      return <ListItem {...attributes}>{children}</ListItem>

    case BlockFormat.Table:
      return (
        <table css={tableStyles}>
          <tbody {...attributes}>{children}</tbody>
        </table>
      )

    case BlockFormat.TableRow:
      return <tr {...attributes}>{children}</tr>

    case BlockFormat.TableCell:
      return (
        <td {...attributes} css={tableCellStyles(theme, element.borderColor as string)}>
          {children}
        </td>
      )

    case InlineFormat.Link:
      return (
        <Link
          target={(element.url as string).startsWith('#') ? '' : '_blank'}
          rel="noreferrer"
          id={element.id as string}
          href={element.url as string}
          title={element.title as string}
          {...attributes}>
          {children}
        </Link>
      )

    default: {
      if (
        element.children.length === 1 &&
        'text' in element.children[0] &&
        !element.children[0].text
      ) {
        return <Fragment />
      }

      return (
        <Paragraph {...attributes} css={lastChildNoGutter}>
          {children}
        </Paragraph>
      )
    }
  }
}
