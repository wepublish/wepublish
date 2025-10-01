import styled from '@emotion/styled';
import { css } from '@mui/material';
import { ArticleListWrapper } from '@wepublish/article/website';
import { BreakBlockWrapper } from '@wepublish/block-content/website';
import {
  EventBlockWrapper,
  ImageBlockWrapper,
  SliderWrapper,
} from '@wepublish/block-content/website';
import { CommentListWrapper } from '@wepublish/comments/website';
import { ContentWrapperStyled } from '@wepublish/content/website';

export const HauptstadtContentFullWidth = styled.div`
  display: grid;
  row-gap: var(--page-content-row-gap);
`;

export const HauptstadtContentWrapper = styled(ContentWrapperStyled)`
  display: grid;
  row-gap: var(--page-content-row-gap);

  --page-content-row-gap: ${({ theme }) => theme.spacing(2.5)};
  --article-content-row-gap: ${({ theme }) => theme.spacing(3)};
  --content-column-gap: ${({ theme }) => theme.spacing(3)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    --page-content-row-gap: ${({ theme }) => theme.spacing(4)};
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    --page-content-row-gap: ${({ theme }) => theme.spacing(6)};
    --content-column-gap: ${({ theme }) => theme.spacing(6)};
  }

  ${({ theme }) => theme.breakpoints.up('xxl')} {
    --page-content-row-gap: ${({ theme }) => theme.spacing(9.5)};
    --content-column-gap: ${({ theme }) => theme.spacing(9)};
  }

  ${({ theme, fullWidth }) =>
    !fullWidth &&
    css`
      ${theme.breakpoints.up('md')} {
        grid-template-columns: repeat(36, 1fr);

        & > *,
        && > ${CommentListWrapper} {
          grid-column: 7/31;
        }

        & > :is(${ImageBlockWrapper}, ${SliderWrapper}, ${EventBlockWrapper}) {
          grid-column: 4/34;
        }

        & > :is(${BreakBlockWrapper}) {
          grid-column: 9/29;
        }

        && > :is(${ArticleListWrapper}, ${HauptstadtContentFullWidth}) {
          grid-column: -1/1;
        }
      }

      ${theme.breakpoints.up('xl')} {
        & > *,
        && > ${CommentListWrapper} {
          grid-column: 10/28;
        }

        & > :is(${ImageBlockWrapper}, ${SliderWrapper}, ${EventBlockWrapper}) {
          grid-column: 7/31;
        }

        & > :is(${BreakBlockWrapper}) {
          grid-column: 12/26;
        }
      }

      ${theme.breakpoints.up('xxl')} {
        & > *,
        && > ${CommentListWrapper} {
          grid-column: 12/26;
        }

        & > :is(${ImageBlockWrapper}, ${SliderWrapper}, ${EventBlockWrapper}) {
          grid-column: 9/29;
        }

        & > :is(${BreakBlockWrapper}) {
          grid-column: 14/24;
        }
      }
    `}
`;
