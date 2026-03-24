import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { hasBlockStyle, isBreakBlock } from '@wepublish/block-content/website';
import { BlockContent } from '@wepublish/website/api';
import {
  BuilderBreakBlockProps,
  BuilderRichTextBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import { ComponentType } from 'react';

type ReflektRichTextBlockType = ComponentType<
  BuilderRichTextBlockProps & { variant?: string }
>;

import { ReflektBlockType } from '../block-styles/reflekt-block-styles';

export const TocWrapper = styled('div')`
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

export const isToc = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderBreakBlockProps =>
  allPass([hasBlockStyle(ReflektBlockType.TableOfContents), isBreakBlock])(
    block
  );

export const Toc = ({ className, text, richText }: BuilderBreakBlockProps) => {
  const {
    blocks: { RichText },
  } = useWebsiteBuilder();

  const ReflektRichText = RichText as ReflektRichTextBlockType;

  return (
    <TocWrapper className={className}>
      <TocTitle variant="tocHeading">{text}</TocTitle>
      <TocDetails variant="tocDetails">
        {richText && (
          <ReflektRichText
            richText={richText}
            variant="toc"
          />
        )}
      </TocDetails>
    </TocWrapper>
  );
};
