import {useWebsiteBuilder} from '@wepublish/website/builder'
import {BuilderRenderElementProps} from '@wepublish/website/builder'
import {Link} from '@mui/material'

export enum BlockFormat {
  H1 = 'heading-one',
  H2 = 'heading-two',
  H3 = 'heading-three',
  Paragraph = 'paragraph',
  UnorderedList = 'unordered-list',
  OrderedList = 'ordered-list',
  ListItem = 'list-item',
  Table = 'table',
  TableRow = 'table-row',
  TableCell = 'table-cell'
}

export enum InlineFormat {
  Link = 'link'
}

export function RenderElement({
  attributes,
  children,
  element
}: BuilderRenderElementProps): JSX.Element {
  const {
    elements: {H1, H2, H3, Paragraph, UnorderedList, OrderedList, ListItem}
  } = useWebsiteBuilder()

  switch (element.type) {
    case BlockFormat.H1:
      return <H1 {...attributes}>{children}</H1>

    case BlockFormat.H2:
      return <H2 {...attributes}>{children}</H2>

    case BlockFormat.H3:
      return <H3 {...attributes}>{children}</H3>

    case BlockFormat.UnorderedList:
      return <UnorderedList {...attributes}>{children}</UnorderedList>

    case BlockFormat.OrderedList:
      return <OrderedList {...attributes}>{children}</OrderedList>

    case BlockFormat.ListItem:
      return <ListItem {...attributes}>{children}</ListItem>

    case BlockFormat.Table:
      return (
        <table>
          <tbody {...attributes}>{children}</tbody>
        </table>
      )

    case BlockFormat.TableRow:
      return <tr {...attributes}>{children}</tr>

    case BlockFormat.TableCell:
      return (
        <td
          {...attributes}
          style={{
            borderColor:
              element.borderColor === 'transparent'
                ? `rgb(0, 0, 0, 0.1)`
                : (element.borderColor as string)
          }}>
          {children}
        </td>
      )

    case InlineFormat.Link:
      return (
        <Link
          target="_blank"
          rel="noreferrer"
          href={element.url as string}
          title={element.title as string}
          {...attributes}>
          {children}
        </Link>
      )

    default:
      return <Paragraph {...attributes}>{children}</Paragraph>
  }
}
