import { css } from '@mui/material';
import styled from '@emotion/styled';
import { useReducer } from 'react';
import { MdInfoOutline } from 'react-icons/md';
import { RichTextBlock } from '../../richtext/richtext-block';
import { allPass } from 'ramda';
import { hasBlockStyle } from '../../has-blockstyle';
import { isBreakBlock } from '../../break/break-block';
import {
  BuilderBlockStyleProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { BlockContent, BreakBlock } from '@wepublish/website/api';

export const ContextBoxWrapper = styled('aside')`
  display: grid;
  grid-template-columns: 36px 1fr;
  grid-auto-rows: max-content;
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: stretch;
  padding: ${({ theme }) => theme.spacing(1)};
`;

export const ContextBoxAllAbout = styled('div')`
  align-self: center;
  font-weight: 600;
`;

export const ContextBoxTitle = styled('div')`
  font-weight: 500;
  font-style: italic;
`;

export const ContextBoxCollapse = styled('div')<{ expanded: boolean }>`
  height: ${({ theme }) => theme.spacing(15)};
  overflow: hidden;
  interpolate-size: allow-keywords;
  transition: height 0.3s ease-in-out;
  font-style: italic;

  ${({ theme, expanded }) =>
    expanded &&
    css`
      height: auto;
    `}
`;

export const ContextBoxContent = styled('div')`
  display: flex;
  flex-flow: column;
  align-items: start;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export const ContextBoxLine = styled('div')`
  justify-self: center;
  width: ${({ theme }) => theme.spacing(1)};
  background-color: currentColor;
`;

export const ContextBoxIcon = styled(MdInfoOutline)``;

export const ContextBox = ({
  className,
  richText,
  text,
}: BuilderBlockStyleProps['ContextBox']) => {
  const [expanded, toggleExpanded] = useReducer(exp => !exp, false);
  const {
    elements: { Button },
  } = useWebsiteBuilder();

  return (
    <ContextBoxWrapper className={className}>
      <ContextBoxIcon size="36" />

      <ContextBoxTitle>{text || `Darum geht's`}</ContextBoxTitle>

      <ContextBoxLine />
      <ContextBoxContent>
        <ContextBoxCollapse expanded={expanded}>
          <RichTextBlock richText={richText} />
        </ContextBoxCollapse>

        <Button onClick={toggleExpanded}>
          {expanded ? 'Weniger lesen' : 'Alles lesen'}
        </Button>
      </ContextBoxContent>
    </ContextBoxWrapper>
  );
};

export const isContextBoxBlockStyle = (
  block: Pick<BlockContent, '__typename'>
): block is BreakBlock =>
  allPass([hasBlockStyle('ContextBox'), isBreakBlock])(block);
