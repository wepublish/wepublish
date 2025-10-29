import {
  BuilderRenderRichtextProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { Fragment } from 'react';
import { Element, Text } from 'slate';

export function RenderRichtext({ elements }: BuilderRenderRichtextProps) {
  const {
    richtext: { RenderLeaf, RenderElement },
  } = useWebsiteBuilder();

  return (
    <Fragment>
      {elements.map((element, index) => {
        if (Element.isElement(element)) {
          return (
            <RenderElement
              key={index}
              element={element}
            />
          );
        }

        if (Text.isText(element)) {
          return (
            <RenderLeaf
              key={index}
              element={element}
            />
          );
        }

        return <Fragment key={index} />;
      })}
    </Fragment>
  );
}
