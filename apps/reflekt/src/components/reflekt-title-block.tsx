import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
  BlockContent,
  TitleBlock as TitleBlockType,
} from '@wepublish/website/api';
import {
  BuilderTitleBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { ComponentType } from 'react';

import { ReflektBlockStyles } from './block-styles/reflekt-block-styles';

export const isTitleBlock = (
  block: Pick<BlockContent, '__typename'>
): block is TitleBlockType => block.__typename === 'TitleBlock';

export const TitleBlockWrapper = styled('div', {
  shouldForwardProp: prop => prop !== 'hasHeroSibling',
})<{ hasHeroSibling?: boolean }>`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  grid-auto-rows: min-content;

  ${({ hasHeroSibling, theme }) =>
    hasHeroSibling && `margin-top: -${theme.spacing(6)};`}
`;
export const TitleBlockTitle = styled('h1')``;
export const TitleBlockLead = styled('p')``;

type TitleBlockComponents = {
  PreTitle?: ComponentType<Pick<BuilderTitleBlockProps, 'preTitle'>>;
};

export const ReflektTitleBlock = ({
  title,
  lead,
  className,
  siblings,
}: BuilderTitleBlockProps & TitleBlockComponents) => {
  const {
    elements: { H2 },
  } = useWebsiteBuilder();

  const hasHeroSibling = !!(
    siblings?.length &&
    siblings[0].typeName === 'FlexBlock' &&
    siblings[0].blockStyle === ReflektBlockStyles.FlexBlockHero
  );

  return (
    <TitleBlockWrapper
      className={className}
      hasHeroSibling={hasHeroSibling}
    >
      {!hasHeroSibling && <H2 component={TitleBlockTitle}>{title}</H2>}

      {lead && (
        <Typography
          variant="subtitle1"
          component={TitleBlockLead}
        >
          {lead}
        </Typography>
      )}
    </TitleBlockWrapper>
  );
};
