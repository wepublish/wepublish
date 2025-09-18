import styled from '@emotion/styled';

import { TeaserOverwrite } from './teaser-overwrite';
import {
  AuthorsAndDate,
  fluidTypography,
  TeaserLeadStyled,
  TeaserPreTitleStyled,
  TeaserTitlesStyled,
} from './teaser-overwrite.style';

export const ColTeaser = styled(TeaserOverwrite)`
  margin-top: ${({ theme }) => theme.spacing(3)};
  align-self: start;

  ${TeaserPreTitleStyled} {
    font-size: ${fluidTypography(17, 25)};
    font-style: italic;
  }

  ${TeaserTitlesStyled} {
    font-size: ${fluidTypography(23, 34)};
    font-weight: bold;
  }

  ${AuthorsAndDate} {
    font-size: ${fluidTypography(12, 17)};
  }

  ${TeaserLeadStyled} {
    margin-top: ${({ theme }) => theme.spacing(1)};
    margin-bottom: ${({ theme }) => theme.spacing(1)};
    font-style: italic;
    font-weight: 300;
    font-size: ${fluidTypography(15, 22)};
  }

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-column: span 6;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    margin-top: ${({ theme }) => theme.spacing(5)};
  }
`;
