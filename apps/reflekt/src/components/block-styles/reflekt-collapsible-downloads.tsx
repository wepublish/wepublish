import styled from '@emotion/styled';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
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
import {
  ExpandIcon,
  ReflektCollapsibleRichTextWrapper,
} from './reflekt-collapsible-richtext';

export const ReflektCollapsibleDownloadsWrapper = styled(
  ReflektCollapsibleRichTextWrapper
)``;

export const isCollapsibleDownloads = (
  block: Pick<BlockContent, '__typename'>
): block is RichTextBlockType =>
  allPass([
    hasBlockStyle(ReflektBlockType.CollapsibleDownloads),
    isRichTextBlock,
  ])(block);

export const ReflektCollapsibleDownloads = ({
  className,
  richText,
}: BuilderRichTextBlockProps) => {
  const {
    blocks: { RichText },
  } = useWebsiteBuilder();
  const thisId = `AC-${React.useId()}`;

  return (
    <ReflektCollapsibleDownloadsWrapper className={className}>
      <AccordionSummary
        expandIcon={<ExpandIcon />}
        aria-controls={`${thisId}-panel-content`}
        id={`${thisId}-panel-header`}
      >
        {richText &&
          richText.length > 0 &&
          (richText[0] as any).children[0].text}
      </AccordionSummary>

      <AccordionDetails id={`${thisId}-panel-content`}>
        {richText && richText.length > 1 && (
          <RichText
            richText={[...richText].splice(1, richText.length - 1)}
            variant="downloads"
          />
        )}
      </AccordionDetails>
    </ReflektCollapsibleDownloadsWrapper>
  );
};
