import styled from '@emotion/styled';
import { css } from '@mui/material';
import {
  TeaserGridBlock,
  TeaserListBlock,
} from '@wepublish/block-content/website';

export const BajourTeaserGrid = styled(TeaserGridBlock)`
  ${({ numColumns, theme }) =>
    numColumns > 1 &&
    css`
      grid-template-columns: repeat(12, 1fr);
      row-gap: ${theme.spacing(3)};
      column-gap: ${theme.spacing(4)};
      align-items: center;

      ${theme.breakpoints.up('sm')} {
        grid-template-columns: repeat(12, 1fr);
        padding-left: calc(100% / 48);
        padding-right: calc(100% / 48);
      }

      ${theme.breakpoints.up('md')} {
        padding-left: calc((100% / 12) * 2);
        padding-right: calc((100% / 12) * 2);
        row-gap: ${theme.spacing(4)};
      }

      ${theme.breakpoints.up('xl')} {
        row-gap: ${theme.spacing(5)};
      }
    `}
`;

export const BajourTeaserList = styled(TeaserListBlock)`
  ${({ theme }) => css`
    grid-template-columns: repeat(12, 1fr);
    row-gap: ${theme.spacing(3)};
    column-gap: ${theme.spacing(4)};
    align-items: center;

    ${theme.breakpoints.up('sm')} {
      grid-template-columns: repeat(12, 1fr);
      padding-left: calc(100% / 48);
      padding-right: calc(100% / 48);
    }

    ${theme.breakpoints.up('md')} {
      padding-left: calc((100% / 12) * 2);
      padding-right: calc((100% / 12) * 2);
      row-gap: ${theme.spacing(4)};
    }

    ${theme.breakpoints.up('xl')} {
      row-gap: ${theme.spacing(5)};
    }
  `}
`;
