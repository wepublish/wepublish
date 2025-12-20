import styled from '@emotion/styled';
import {
  BlockContent,
  TitleBlock as TitleBlockType,
} from '@wepublish/website/api';
import {
  BuilderTitleBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { Typography } from '@mui/material';
import { ComponentType } from 'react';

export const isTitleBlock = (
  block: Pick<BlockContent, '__typename'>
): block is TitleBlockType => block.__typename === 'TitleBlock';

export const TitleBlockWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  grid-auto-rows: min-content;
`;
export const TitleBlockTitle = styled('h1')``;

export const TitleBlockPreTitleWrapper = styled('div')`
  padding: ${({ theme }) => `${theme.spacing(0.5)} ${theme.spacing(2)}`};
  background-color: ${({ theme }) => theme.palette.accent.main};
  color: ${({ theme }) => theme.palette.accent.contrastText};
  width: fit-content;
  margin-bottom: -${({ theme }) => theme.spacing(1.5)};
`;
export const TitleBlockLead = styled('p')``;

type TitleBlockComponents = {
  PreTitle?: ComponentType<Pick<BuilderTitleBlockProps, 'preTitle'>>;
};

export const TitleBlockPreTitle: Exclude<
  TitleBlockComponents['PreTitle'],
  undefined
> = ({ preTitle }) =>
  preTitle && (
    <Typography
      variant="blockTitlePreTitle"
      component={TitleBlockPreTitleWrapper}
    >
      {preTitle}
    </Typography>
  );

export const TitleBlock = ({
  title,
  preTitle,
  lead,
  className,
  PreTitle = TitleBlockPreTitle,
}: BuilderTitleBlockProps & TitleBlockComponents) => {
  const {
    elements: { H2 },
  } = useWebsiteBuilder();

  return (
    <TitleBlockWrapper className={className}>
      <PreTitle preTitle={preTitle} />

      <H2 component={TitleBlockTitle}>{title}</H2>

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
