import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
  hasBlockStyle,
  isRichTextBlock,
} from '@wepublish/block-content/website';
import {
  BlockContent,
  RichTextBlock as RichTextBlockType,
} from '@wepublish/website/api';
import {
  BuilderRichTextBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import { ComponentType } from 'react';

type ReflektRichTextBlockType = ComponentType<
  BuilderRichTextBlockProps & { variant?: string }
>;

import { ReflektBlockType } from './reflekt-block-styles';

export const ReflektTocRichTextWrapper = styled('div')`
  margin: 0;
  background-color: ${({ theme }) => theme.palette.secondary.dark};
  color: ${({ theme }) => theme.palette.common.white};
  display: grid;
  grid-template-columns: subgrid;
  grid-template-rows: repeat(2, auto);
`;

export const TocTitle = styled(Typography)`
  grid-column: 3 / 11;
  grid-row: 1 / 2;

  & > * {
    margin-left: ${({ theme }) => theme.spacing(4)};
    margin-right: ${({ theme }) => theme.spacing(4)};
  }
`;

export const TocDetails = styled(Typography)`
  grid-column: 3 / 11;
  grid-row: 2 / 3;

  & > * {
    margin-left: ${({ theme }) => theme.spacing(4)};
    margin-right: ${({ theme }) => theme.spacing(4)};
  }
`;

export const isTocRichText = (
  block: Pick<BlockContent, '__typename'>
): block is RichTextBlockType =>
  allPass([hasBlockStyle(ReflektBlockType.TableOfContents), isRichTextBlock])(
    block
  );

export const ReflektTocRichText = ({
  className,
  richText,
}: BuilderRichTextBlockProps) => {
  const {
    blocks: { RichText },
  } = useWebsiteBuilder();

  const ReflektRichText = RichText as ReflektRichTextBlockType;

  return (
    <ReflektTocRichTextWrapper className={className}>
      <TocTitle variant="tocHeading">
        {richText &&
          richText.length > 0 &&
          (richText[0] as any).children[0].text}
      </TocTitle>
      <TocDetails variant="tocDetails">
        {richText && richText.length > 1 && (
          <ReflektRichText
            richText={[...richText].splice(1, richText.length - 1)}
            variant="toc"
          />
        )}
      </TocDetails>
    </ReflektTocRichTextWrapper>
  );
};
