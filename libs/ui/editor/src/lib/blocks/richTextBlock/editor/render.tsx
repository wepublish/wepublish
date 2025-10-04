import styled from '@emotion/styled';
import { BlockFormat, InlineFormat, TextFormat } from '@wepublish/richtext';
import { RenderElementProps, RenderLeafProps } from 'slate-react';

const Table = styled.table`
  white-space: pre-wrap;
  width: 100%;
  margin: 10px;
  table-layout: fixed;
`;

const TD = styled.td<{ borderColor: string }>`
  border: ${({ borderColor }) =>
    borderColor === 'transparent' ?
      '1px solid rgba(0, 0, 0, 0.1)'
    : `1px solid ${borderColor}`};
  padding: 8px;
`;

export function renderElement({
  attributes,
  children,
  element,
}: RenderElementProps) {
  switch (element.type) {
    case BlockFormat.H1:
      return <h1 {...attributes}>{children}</h1>;

    case BlockFormat.H2:
      return <h2 {...attributes}>{children}</h2>;

    case BlockFormat.H3:
      return <h3 {...attributes}>{children}</h3>;

    case BlockFormat.UnorderedList:
      return <ul {...attributes}>{children}</ul>;

    case BlockFormat.OrderedList:
      return <ol {...attributes}>{children}</ol>;

    case BlockFormat.ListItem:
      return <li {...attributes}>{children}</li>;

    case BlockFormat.Table:
      return (
        <Table>
          <tbody {...attributes}>{children}</tbody>
        </Table>
      );

    case BlockFormat.TableRow:
      return <tr {...attributes}>{children}</tr>;

    case BlockFormat.TableCell:
      return (
        <TD
          borderColor={element.borderColor as string}
          {...attributes}
        >
          {children}
        </TD>
      );

    case InlineFormat.Link:
      // TODO: Implement custom tooltip
      // const title = element.title ? `${element.title}: ${element.url}` : element.url
      // title={title}

      return (
        <a
          data-title={element.title}
          data-href={element.url}
          {...attributes}
        >
          {children}
        </a>
      );

    default:
      return <p {...attributes}>{children}</p>;
  }
}

export function renderLeaf({ attributes, children, leaf }: RenderLeafProps) {
  if (leaf[TextFormat.Bold]) {
    children = <strong {...attributes}>{children}</strong>;
  }

  if (leaf[TextFormat.Italic]) {
    children = <em {...attributes}>{children}</em>;
  }

  if (leaf[TextFormat.Underline]) {
    children = <u {...attributes}>{children}</u>;
  }

  if (leaf[TextFormat.Strikethrough]) {
    children = <del {...attributes}>{children}</del>;
  }

  if (leaf[TextFormat.Superscript]) {
    children = <sup {...attributes}>{children}</sup>;
  }

  if (leaf[TextFormat.Subscript]) {
    children = <sub {...attributes}>{children}</sub>;
  }

  return <span {...attributes}>{children}</span>;
}
