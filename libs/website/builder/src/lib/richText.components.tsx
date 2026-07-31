import { BuilderRenderRichtextProps } from './richText.interface';

import { useWebsiteBuilder } from './website-builder.context';

export const RenderRichtext = (props: BuilderRenderRichtextProps) => {
  const {
    richtext: { RenderRichtext },
  } = useWebsiteBuilder();

  return <RenderRichtext {...props} />;
};
