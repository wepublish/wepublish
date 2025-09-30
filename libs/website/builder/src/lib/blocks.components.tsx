import { BuilderRichTextBlockProps } from './blocks.interface';

import { useWebsiteBuilder } from './website-builder.context';

export const RichTextBlock = (props: BuilderRichTextBlockProps) => {
  const {
    blocks: { RichText },
  } = useWebsiteBuilder();

  return <RichText {...props} />;
};
