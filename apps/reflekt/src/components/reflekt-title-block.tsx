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

import { ReflektBlockType } from './block-styles/reflekt-block-styles';

export const isTitleBlock = (
  block: Pick<BlockContent, '__typename'>
): block is TitleBlockType => block.__typename === 'TitleBlock';

export const TitleBlockWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  grid-auto-rows: min-content;
`;
export const TitleBlockTitle = styled('h1')``;
export const TitleBlockLead = styled('p')``;

type TitleBlockComponents = {
  PreTitle?: ComponentType<Pick<BuilderTitleBlockProps, 'preTitle'>>;
};

export const ReflektTitleBlock = ({
  title,
  preTitle,
  lead,
  className,
  siblings,
}: BuilderTitleBlockProps &
  TitleBlockComponents & {
    siblings?: Array<{ typeName: string; blockStyle?: string }>;
  }) => {
  const {
    elements: { H2 },
  } = useWebsiteBuilder();

  const hasHeroSibling =
    (siblings &&
      siblings[0]?.typeName === 'FlexBlock' &&
      siblings[0]?.blockStyle === ReflektBlockType.FlexBlockHero) ??
    false;

  return (
    <TitleBlockWrapper className={className}>
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
