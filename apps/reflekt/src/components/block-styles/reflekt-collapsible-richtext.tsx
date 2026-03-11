import styled from '@emotion/styled';
import Accordion from '@mui/material/Accordion';
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
import { MdArrowDownward } from 'react-icons/md';

import { ReflektBlockType } from './reflekt-block-styles';
export const ReflektCollapsibleRichTextWrapper = styled(Accordion)`
  overflow-anchor: auto;
  margin: 0;

  &::before {
    display: none;
  }
`;

export const ExpandIcon = styled(MdArrowDownward)`
  font-size: 1.5rem;
  transform: rotate(0deg);
  transition: transform 0.2s ease-in-out;
  transform-origin: center;

  .Mui-expanded & {
    transform: rotate(180deg);
  }
`;

export const isCollapsibleRichText = (
  block: Pick<BlockContent, '__typename'>
): block is RichTextBlockType =>
  allPass([
    hasBlockStyle(ReflektBlockType.CollapsibleRichText),
    isRichTextBlock,
  ])(block);

export const ReflektCollapsibleRichText = ({
  className,
  richText,
}: BuilderRichTextBlockProps) => {
  const {
    blocks: { RichText },
  } = useWebsiteBuilder();
  const thisId = `AC-${React.useId()}`;

  return (
    <ReflektCollapsibleRichTextWrapper className={className}>
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
          <RichText richText={[...richText].splice(1, richText.length - 1)} />
        )}
      </AccordionDetails>
    </ReflektCollapsibleRichTextWrapper>
  );
};
