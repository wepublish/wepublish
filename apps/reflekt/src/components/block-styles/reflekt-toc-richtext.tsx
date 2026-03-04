import styled from '@emotion/styled';
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
import React from 'react';

import { ReflektBlockType } from './reflekt-block-styles';

export const ReflektTocRichTextWrapper = styled('div')`
  margin: 0;
  background-color: ${({ theme }) => theme.palette.secondary.dark};
  color: ${({ theme }) => theme.palette.common.white};
  display: grid;
  grid-template-columns: subgrid;
  grid-template-rows: repeat(2, auto);
`;

export const TocTitle = styled('div')`
  grid-column: 3 / 9;
  grid-row: 1 / 2;
`;

export const TocDetails = styled('div')`
  grid-column: 3 / 9;
  grid-row: 2 / 3;
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

  return (
    <ReflektTocRichTextWrapper className={className}>
      <TocTitle>
        {richText &&
          richText.length > 0 &&
          (richText[0] as any).children[0].text}
      </TocTitle>
      <TocDetails>
        {richText && richText.length > 1 && (
          <RichText richText={[...richText].splice(1, richText.length - 1)} />
        )}
      </TocDetails>
    </ReflektTocRichTextWrapper>
  );
};
