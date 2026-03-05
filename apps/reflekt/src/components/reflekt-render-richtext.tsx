import {
  BuilderRenderRichtextProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { Fragment } from 'react';
import { Element, Text } from 'slate';

export function ReflektRenderRichtext({
  elements,
  variant,
}: BuilderRenderRichtextProps & { variant?: string }) {
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
              variant={variant}
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
