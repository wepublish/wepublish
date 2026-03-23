import styled from '@emotion/styled';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import { hasBlockStyle, isBreakBlock } from '@wepublish/block-content/website';
import { BlockContent } from '@wepublish/website/api';
import {
  BuilderBreakBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { allPass } from 'ramda';
import React from 'react';
import { MdArrowDownward } from 'react-icons/md';

import { ReflektBlockType } from '../block-styles/reflekt-block-styles';

export const ReflektCollapsibleContentWrapper = styled(Accordion)`
  overflow-anchor: auto;
  margin: 0;

  &::before {
    display: none;
  }

  ul {
    padding-left: ${({ theme }) => theme.spacing(2)};
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

export const isCollapsibleContent = (
  block: Pick<BlockContent, '__typename'>
): block is BuilderBreakBlockProps =>
  allPass([hasBlockStyle(ReflektBlockType.CollapsibleContent), isBreakBlock])(
    block
  );

export const ReflektCollapsibleContent = ({
  className,
  text,
  richText,
}: BuilderBreakBlockProps) => {
  const {
    blocks: { RichText },
  } = useWebsiteBuilder();
  const thisId = `AC-${React.useId().replace(/:/g, '')}`;

  return (
    <ReflektCollapsibleContentWrapper className={className}>
      <AccordionSummary
        expandIcon={<ExpandIcon />}
        aria-controls={`${thisId}-panel-content`}
        id={`${thisId}-panel-header`}
      >
        {text}
      </AccordionSummary>

      <AccordionDetails id={`${thisId}-panel-content`}>
        <RichText richText={richText} />
      </AccordionDetails>
    </ReflektCollapsibleContentWrapper>
  );
};
