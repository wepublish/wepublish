import styled from '@emotion/styled';
import { css } from '@mui/material';
import {
  BaseTeaser,
  TeaserImage,
  TeaserPreTitle,
  TeaserPreTitleWrapper,
  TeaserLead,
} from '@wepublish/block-content/website';

export const CourantTeaser = styled(BaseTeaser)`
  ${TeaserPreTitle} {
    ${({ theme }) => css(theme.typography.teaserPretitle)}
    transform: none;
    background-color: transparent;
  }

  ${TeaserPreTitleWrapper} {
    background-color: transparent;
    margin-top: ${({ theme }) => theme.spacing(4)};
    margin-bottom: ${({ theme }) => theme.spacing(5)};
  }

  ${TeaserImage} {
    aspect-ratio: 16 / 9;
    transform: none;
  }

  ${TeaserLead} {
    text-wrap: balance;
    max-width: 90%;
  }
`;
