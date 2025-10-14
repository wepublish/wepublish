import styled from '@emotion/styled';
import { Button } from '@mui/material';
import { TeaserLead } from '@wepublish/block-content/website';
import { Image } from '@wepublish/image/website';
import { H1, Paragraph } from '@wepublish/ui';
import { NextWepublishLink } from '@wepublish/utils/website';

export const fluidTypography = (minSize: number, maxSize: number): string => {
  const minViewPort = 390;
  const maxViewPort = 3840;

  return `clamp(
    ${minSize}px,
    calc(
      ${minSize}px + (${maxSize} - ${minSize}) * (
        (100vw + ${minViewPort}px) / (${maxViewPort} - ${minViewPort})
      )
    ),
    ${maxSize}px
  )`;
};

export const LinkAndGridContainer = styled(NextWepublishLink)`
  grid-column: -1/1;
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  grid-template-rows: auto;
  align-items: center;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-template-columns: repeat(12, 1fr);
  }
`;

export const TeaserImgStyled = styled(Image)`
  width: 100%;
  object-fit: cover;
  grid-column: -1/1;
  aspect-ratio: 3/2;
`;

export const TeaserContentStyled = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1)};
  grid-template-rows: auto;
  grid-auto-rows: max-content;
  grid-column: initial;
`;

export const TeaserPreTitleStyled = styled('span')``;

export const TeaserTitlesStyled = styled(H1)`
  margin: 0;
`;

export const TitleLine = styled('hr')`
  background-color: ${({ theme }) => theme.palette.secondary.dark};
  height: 2px;
  width: 100%;
  margin: 0;
  border: 0;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    height: 3px;
  }
`;

export const AuthorsAndDate = styled(Paragraph)``;

export const TeaserLeadStyled = styled('div')``;

export const SingleLine = styled('hr')`
  background-color: #ffdddd;
  border: 0;
  margin: 0;
`;

export const TextLine = styled('hr')`
  background-color: #ffdddd;
  border: 0;
  margin: 0;
`;

export const TeaserLeadBelow = styled(TeaserLead)`
  grid-area: initial;
  margin: 0;
  grid-column: -1/1;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    display: none;
  }
`;

export const ReadMoreButton = styled(Button)`
  justify-self: end;
`;
