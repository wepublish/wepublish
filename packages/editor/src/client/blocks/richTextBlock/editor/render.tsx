import React from 'react'
import {RenderElementProps, RenderLeafProps} from 'slate-react'
import {BlockFormat, InlineFormat, TextFormat} from './formats'

export function renderElement({attributes, children, element}: RenderElementProps) {
  switch (element.type) {
    case BlockFormat.H1:
      return <h1 {...attributes}>{children}</h1>

    case BlockFormat.H2:
      return <h2 {...attributes}>{children}</h2>

    case BlockFormat.H3:
      return <h3 {...attributes}>{children}</h3>

    case BlockFormat.UnorderedList:
      return <ul {...attributes}>{children}</ul>

    case BlockFormat.OrderedList:
      return <ol {...attributes}>{children}</ol>

    case BlockFormat.ListItem:
      return <li {...attributes}>{children}</li>

    case BlockFormat.Table:
      return (
        <table>
          <tbody {...attributes}>{children}</tbody>
        </table>
      )

    case BlockFormat.TableRow:
      return <tr {...attributes}>{children}</tr>

    case BlockFormat.TableCell:
      // TODO custom borderColor using colorPicker
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
      // TODO: Implement custom tooltip
      // const title = element.title ? `${element.title}: ${element.url}` : element.url
      // title={title}

      return (
        <a data-title={element.title} data-href={element.url} {...attributes}>
          {children}
        </a>
      )

    default:
      return <p {...attributes}>{children}</p>
  }
}

export function renderLeaf({attributes, children, leaf}: RenderLeafProps) {
  if (leaf[TextFormat.Bold]) {
    children = <strong {...attributes}>{children}</strong>
  }

  if (leaf[TextFormat.Italic]) {
    children = <em {...attributes}>{children}</em>
  }

  if (leaf[TextFormat.Underline]) {
    children = <u {...attributes}>{children}</u>
  }

  if (leaf[TextFormat.Strikethrough]) {
    children = <del {...attributes}>{children}</del>
  }

  if (leaf[TextFormat.Superscript]) {
    children = <sup {...attributes}>{children}</sup>
  }

  if (leaf[TextFormat.Subscript]) {
    children = <sub {...attributes}>{children}</sub>
  }

  return <span {...attributes}>{children}</span>
}
