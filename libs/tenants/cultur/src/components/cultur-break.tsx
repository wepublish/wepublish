import styled from '@emotion/styled';
import { BreakBlock } from '@wepublish/block-content/website';

export const CulturBreakBlock = styled(BreakBlock)`
  background-color: ${({ theme }) => theme.palette.primary.contrastText};
  color: ${({ theme }) => theme.palette.primary.main};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    padding-left: 0;
    padding-right: 0;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding-left: ${({ theme }) => theme.spacing(10)};
    padding-right: ${({ theme }) => theme.spacing(10)};
  }

  .MuiButton-root,
  .MuiButton-root:hover {
    background-color: ${({ theme }) => theme.palette.grey[300]};
  }
`;
