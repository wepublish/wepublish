import styled from '@emotion/styled';
import { ContentWrapperStyled } from '@wepublish/content/website';

export const FactuelContentFullWidth = styled.div`
  display: grid;
  row-gap: var(--page-content-row-gap);
`;

export const FactuelContentWrapper = styled(ContentWrapperStyled)`
  display: grid;
  row-gap: var(--page-content-row-gap);

  --page-content-row-gap: ${({ theme }) => theme.spacing(2)};
  --article-content-row-gap: ${({ theme }) => theme.spacing(3)};
  --content-column-gap: ${({ theme }) => theme.spacing(3)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    --page-content-row-gap: ${({ theme }) => theme.spacing(2)};
  }

  ${({ theme }) => theme.breakpoints.up('lg')} {
    --page-content-row-gap: ${({ theme }) => theme.spacing(3)};
    --content-column-gap: ${({ theme }) => theme.spacing(3)};
  }

  ${({ theme }) => theme.breakpoints.up('xl')} {
    --page-content-row-gap: ${({ theme }) => theme.spacing(4)};
    --content-column-gap: ${({ theme }) => theme.spacing(4)};
  }
`;
