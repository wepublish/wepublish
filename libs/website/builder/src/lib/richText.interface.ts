import { Descendant, Element, Text } from 'slate';

export type BuilderRenderRichtextProps = {
  elements: Descendant[];
};

export type BuilderRenderElementProps = {
  element: Element;
};

export type BuilderRenderLeafProps = {
  element: Text;
};
