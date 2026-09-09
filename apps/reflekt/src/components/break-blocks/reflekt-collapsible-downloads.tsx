import styled from '@emotion/styled';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import { hasBlockStyle, isBreakBlock } from '@wepublish/block-content/website';
import { BlockContent } from '@wepublish/website/api';
import {
  BuilderBreakBlockProps,
  BuilderRichTextBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import React, { ComponentType } from 'react';

type ReflektRichTextBlockType = ComponentType<
  BuilderRichTextBlockProps & { variant?: string }
>;

import { anchorId } from '../anchor-id';
import { ReflektBlockStyles } from '../block-styles/reflekt-block-styles';
import {
  CollapsibleContentWrapper,
  ExpandIcon,
} from './reflekt-collapsible-content';

export const CollapsibleDownloadsWrapper = styled(CollapsibleContentWrapper)`
  ul {
    padding-left: 0;
  }
`;

export const isCollapsibleDownloads = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderBreakBlockProps =>
  allPass([
    hasBlockStyle(ReflektBlockStyles.CollapsibleDownloads),
    isBreakBlock,
  ])(block);

export const CollapsibleDownloads = ({
  className,
  text,
  richText,
}: BuilderBreakBlockProps) => {
  const {
    blocks: { RichText },
  } = useWebsiteBuilder();

  const ReflektRichText = RichText as ReflektRichTextBlockType;
  const thisId = `AC-${React.useId()}`;
  const titleId = anchorId(text);

  return (
    <CollapsibleDownloadsWrapper className={className}>
      <AccordionSummary
        expandIcon={<ExpandIcon />}
        aria-controls={`${thisId}-panel-content`}
        id={titleId ?? `${thisId}-panel-header`}
      >
        {text}
      </AccordionSummary>

      <AccordionDetails id={`${thisId}-panel-content`}>
        {richText && (
          <ReflektRichText
            richText={richText}
            variant="downloads"
          />
        )}
      </AccordionDetails>
    </CollapsibleDownloadsWrapper>
  );
};
