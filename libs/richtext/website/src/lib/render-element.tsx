import { css } from '@emotion/react';
import { RichtextElements } from '@wepublish/richtext';
import {
  BuilderRenderElementProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { ReactNode, useMemo } from 'react';

const lastChildNoGutter = css`
  &&:first-child {
    padding-top: 0;
  }

  &&:last-child {
    margin-bottom: 0;
  }
`;
export const RenderElement = ({ element }: BuilderRenderElementProps) => {
  const {
    richtext: { RenderLeaf, RenderElement },
    elements: {
      Paragraph,
      H1,
      H2,
      H3,
      H4,
      H5,
      H6,
      ListItem,
      OrderedList,
      UnorderedList,
    },
  } = useWebsiteBuilder();

  const children = useMemo(
    () =>
      (element.content as RichtextElements[])?.map((el, key) => (
        <RenderElement
          key={key}
          element={el}
        />
      )),
    [RenderElement, element.content]
  );

  switch (element.type) {
    case 'image': {
      return <img {...element.attrs} />;
    }

    case 'heading': {
      if (element.attrs.level === 1) {
        return (
          <H1
            gutterBottom
            css={lastChildNoGutter}
          >
            {children}
          </H1>
        );
      }

      if (element.attrs.level === 2) {
        return (
          <H2
            gutterBottom
            css={lastChildNoGutter}
          >
            {children}
          </H2>
        );
      }

      if (element.attrs.level === 3) {
        return (
          <H3
            gutterBottom
            css={lastChildNoGutter}
          >
            {children}
          </H3>
        );
      }

      if (element.attrs.level === 4) {
        return (
          <H4
            gutterBottom
            css={lastChildNoGutter}
          >
            {children}
          </H4>
        );
      }

      if (element.attrs.level === 5) {
        return (
          <H5
            gutterBottom
            css={lastChildNoGutter}
          >
            {children}
          </H5>
        );
      }

      if (element.attrs.level === 6) {
        return (
          <H6
            gutterBottom
            css={lastChildNoGutter}
          >
            {children}
          </H6>
        );
      }

      break;
    }

    case 'paragraph': {
      return <Paragraph css={lastChildNoGutter}>{children}</Paragraph>;
    }

    case 'text': {
      const marks = element.marks ?? [];

      const render = marks.reduce(
        (prev, curr): ReactNode => (
          <RenderLeaf
            mark={curr}
            children={prev}
          />
        ),
        element.text
      );

      return render;
    }

    case 'listItem': {
      return <ListItem css={lastChildNoGutter}>{children}</ListItem>;
    }
    case 'orderedList': {
      return <OrderedList css={lastChildNoGutter}>{children}</OrderedList>;
    }
    case 'bulletList': {
      return <UnorderedList css={lastChildNoGutter}>{children}</UnorderedList>;
    }

    case 'table': {
      return (
        <table>
          <colgroup>
            {element.content
              ?.at(0)
              ?.content?.flatMap(item => [...(item.attrs.colwidth ?? [0])])
              .map((colwidth, index) => (
                <col
                  key={index}
                  style={{
                    minWidth: '25px',
                    width: colwidth ? `${colwidth}px` : undefined,
                  }}
                />
              ))}
          </colgroup>
          <tbody>{children}</tbody>
        </table>
      );
    }
    case 'tableRow': {
      return <tr>{children}</tr>;
    }
    case 'tableHeader': {
      return (
        <th
          colSpan={element.attrs.colspan}
          rowSpan={element.attrs.rowspan}
          style={{ borderColor: element.attrs.borderColor ?? undefined }}
        >
          {children}
        </th>
      );
    }
    case 'tableCell': {
      return (
        <td
          colSpan={element.attrs.colspan}
          rowSpan={element.attrs.rowspan}
          style={{ borderColor: element.attrs.borderColor ?? undefined }}
        >
          {children}
        </td>
      );
    }

    case 'codeBlock': {
      return (
        <pre>
          <code>{children}</code>
        </pre>
      );
    }
    case 'blockquote': {
      return <blockquote>{children}</blockquote>;
    }

    case 'hardBreak': {
      return <br />;
    }
  }

  return null;
};
