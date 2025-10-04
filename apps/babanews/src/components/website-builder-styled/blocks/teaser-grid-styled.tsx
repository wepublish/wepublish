import styled from '@emotion/styled';
import { css } from '@mui/material';
import { TeaserGridBlock } from '@wepublish/block-content/website';

export const BabanewsTeaserGrid = styled(TeaserGridBlock)`
  ${({ numColumns, theme }) =>
    numColumns > 1 &&
    css`
      row-gap: ${theme.spacing(3)};
      column-gap: ${theme.spacing(4)};
      padding-left: calc(100% / 28);
      padding-right: calc(100% / 28);
      align-items: start;

      ${theme.breakpoints.up('md')} {
        row-gap: ${theme.spacing(6)};
        padding-left: calc(100% / 20);
        padding-right: calc(100% / 20);
        row-gap: ${theme.spacing(8)};
      }

      ${theme.breakpoints.up('xl')} {
        padding-left: calc(100% / 12);
        padding-right: calc(100% / 12);
        row-gap: ${theme.spacing(5)};
      }
    `}
`;
