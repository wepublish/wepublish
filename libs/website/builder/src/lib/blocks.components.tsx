import {
  BuilderBlocksProps,
  BuilderImageBlockProps,
  BuilderRichTextBlockProps,
} from './blocks.interface';

import { useWebsiteBuilder } from './website-builder.context';

export const RichTextBlock = (props: BuilderRichTextBlockProps) => {
  const {
    blocks: { RichText },
  } = useWebsiteBuilder();

  return <RichText {...props} />;
};

export const ImageBlock = (props: BuilderImageBlockProps) => {
  const {
    blocks: { Image },
  } = useWebsiteBuilder();

  return <Image {...props} />;
};

export const Blocks = (props: BuilderBlocksProps) => {
  const {
    blocks: { Blocks },
  } = useWebsiteBuilder();

  return <Blocks {...props} />;
};
