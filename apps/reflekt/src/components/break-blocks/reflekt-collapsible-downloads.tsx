import styled from '@emotion/styled';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import { hasBlockStyle, isBreakBlock } from '@wepublish/block-content/website';
import {
  BlockContent,
  BreakBlock as BreakBlockType,
} from '@wepublish/website/api';
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

import { ReflektBlockType } from '../block-styles/reflekt-block-styles';
import {
  ExpandIcon,
  ReflektCollapsibleContentWrapper,
} from './reflekt-collapsible-content';

export const ReflektCollapsibleDownloadsWrapper = styled(
  ReflektCollapsibleContentWrapper
)``;

export const isCollapsibleDownloads = (
  block: Pick<BlockContent, '__typename'>
): block is BreakBlockType =>
  allPass([hasBlockStyle(ReflektBlockType.CollapsibleDownloads), isBreakBlock])(
    block
  );

export const ReflektCollapsibleDownloads = ({
  className,
  text,
  richText,
}: BuilderBreakBlockProps) => {
  const {
    blocks: { RichText },
  } = useWebsiteBuilder();

  const ReflektRichText = RichText as ReflektRichTextBlockType;
  const thisId = `AC-${React.useId()}`;

  return (
    <ReflektCollapsibleDownloadsWrapper className={className}>
      <AccordionSummary
        expandIcon={<ExpandIcon />}
        aria-controls={`${thisId}-panel-content`}
        id={`${thisId}-panel-header`}
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
    </ReflektCollapsibleDownloadsWrapper>
  );
};
