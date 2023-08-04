import {useWebsiteBuilder} from '@wepublish/website/builder'
import {BuilderRenderElementProps} from '@wepublish/website/builder'
import {Link} from '@mui/material'
import {BlockFormat, InlineFormat} from '@wepublish/richtext'

export function RenderElement({
  attributes,
  children,
  element
}: BuilderRenderElementProps): JSX.Element {
  const {
    elements: {H4, H5, H6, Paragraph, UnorderedList, OrderedList, ListItem}
  } = useWebsiteBuilder()

  switch (element.type) {
    case BlockFormat.H1:
      return (
        <H4 component="h2" {...attributes}>
          {children}
        </H4>
      )

    case BlockFormat.H2:
      return (
        <H5 component="h3" {...attributes}>
          {children}
        </H5>
      )

    case BlockFormat.H3:
      return (
        <H6 component="h4" {...attributes}>
          {children}
        </H6>
      )

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
      return <td {...attributes}>{children}</td>

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
