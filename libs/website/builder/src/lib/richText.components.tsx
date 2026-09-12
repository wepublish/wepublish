import {
  BuilderRenderElementProps,
  BuilderRenderLeafProps,
  BuilderRenderRichtextProps,
} from './richText.interface';

import { useWebsiteBuilder } from './website-builder.context';

export const RenderRichtext = (props: BuilderRenderRichtextProps) => {
  const {
    richtext: { RenderRichtext },
  } = useWebsiteBuilder();

  return <RenderRichtext {...props} />;
};

export const RenderLeaf = (props: BuilderRenderLeafProps) => {
  const {
    richtext: { RenderLeaf },
  } = useWebsiteBuilder();

  return <RenderLeaf {...props} />;
};

export const RenderElement = (props: BuilderRenderElementProps) => {
  const {
    richtext: { RenderElement },
  } = useWebsiteBuilder();

  return <RenderElement {...props} />;
};
