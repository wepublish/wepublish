import {
  BlockContent,
  FullBlockFragment,
  FullBlockTemplateBlockFragment,
} from '@wepublish/website/api';
import {
  BuilderBlockRendererProps,
  BuilderBlockTemplateBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export const isBlockTemplateBlock = (
  block: Pick<BlockContent, '__typename'>
): block is FullBlockTemplateBlockFragment => {
  return block.__typename === 'BlockTemplateBlock';
};

export const BlockTemplateBlock = ({
  template,
  type,
  level,
}: BuilderBlockTemplateBlockProps & {
  type?: BuilderBlockRendererProps['type'];
  level?: number;
}) => {
  const {
    blocks: { Renderer },
  } = useWebsiteBuilder();

  if (!template) {
    return null;
  }

  return (
    <>
      {template.blocks.map((block, index) => (
        <Renderer
          key={index}
          block={block as FullBlockFragment}
          type={type ?? 'Page'}
          level={(level ?? 0) + 1}
          index={index}
          count={template.blocks.length}
        />
      ))}
    </>
  );
};
