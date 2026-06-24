import styled from '@emotion/styled';
import {
  hasBlockStyle,
  isIFrameBlock,
  isImageBlock,
  isRichTextBlock,
} from '@wepublish/block-content/website';
import {
  BlockContent,
  FullIFrameBlockFragment,
  FullImageBlockFragment,
  FullRichTextBlockFragment,
} from '@wepublish/website/api';
import {
  BuilderIFrameBlockProps,
  BuilderImageBlockProps,
  BuilderRichTextBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass, anyPass } from 'ramda';

export const MannschaftContentBox = (
  props:
    | BuilderImageBlockProps
    | BuilderRichTextBlockProps
    | BuilderIFrameBlockProps
) => {
  const {
    blocks: { Image, RichText, IFrame },
  } = useWebsiteBuilder();

  return (
    <MannschaftContentBoxWrapper>
      {isImageBlock(props) && <Image {...props} />}
      {isRichTextBlock(props) && <RichText {...props} />}
      {isIFrameBlock(props) && <IFrame {...props} />}
    </MannschaftContentBoxWrapper>
  );
};

const MannschaftContentBoxWrapper = styled('div')`
  padding: ${({ theme }) => theme.spacing(3)};
  background-color: ${({ theme }) => theme.palette.grey['200']};

  & + & {
    margin-top: -${({ theme }) => theme.spacing(9)};
  }
`;

export const isContentBoxBlock = (
  block: Pick<BlockContent, '__typename'>
): block is
  | FullImageBlockFragment
  | FullRichTextBlockFragment
  | FullIFrameBlockFragment =>
  allPass([
    anyPass([isImageBlock, isRichTextBlock, isIFrameBlock]),
    hasBlockStyle('ContentBox'),
  ])(block);
