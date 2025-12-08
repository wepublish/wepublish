import styled from '@emotion/styled';
import {
  BuilderRichTextBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import {
  BlockContent,
  RichTextBlock as RichTextBlockType,
} from '@wepublish/website/api';

export const isRichTextBlock = (
  block: Pick<BlockContent, '__typename'>
): block is RichTextBlockType => block.__typename === 'RichTextBlock';

export const RichTextBlockWrapper = styled('div')`
  position: relative;
  white-space: pre-wrap;
  overflow-wrap: break-word;
`;

export const RichTextBlock = ({
  className,
  style,
  richText,
}: BuilderRichTextBlockProps) => {
  const {
    richtext: { RenderRichtext },
  } = useWebsiteBuilder();

  return (
    <RichTextBlockWrapper
      className={className}
      style={style}
    >
      <RenderRichtext document={richText} />
    </RichTextBlockWrapper>
  );
};
