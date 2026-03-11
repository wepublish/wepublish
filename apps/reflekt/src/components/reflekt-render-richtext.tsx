import {
  BuilderRenderElementProps,
  BuilderRenderRichtextProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { ComponentType, Fragment } from 'react';
import { Element, Text } from 'slate';

type ReflektRenderElementType = ComponentType<
  BuilderRenderElementProps & { variant?: string }
>;

export type ReflektRenderRichtextType = ComponentType<
  BuilderRenderRichtextProps & { variant?: string }
>;

export function ReflektRenderRichtext({
  elements,
  variant,
}: BuilderRenderRichtextProps & { variant?: string }) {
  const {
    richtext: { RenderLeaf, RenderElement },
  } = useWebsiteBuilder();

  const ReflektRenderElement = RenderElement as ReflektRenderElementType;

  return (
    <Fragment>
      {elements.map((element, index) => {
        if (Element.isElement(element)) {
          return (
            <ReflektRenderElement
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
