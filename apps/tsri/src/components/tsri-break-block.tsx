import styled from '@emotion/styled';
import {
  BreakBlock,
  BreakBlockHeading,
} from '@wepublish/block-content/website';

export const TsriBreakBlock = styled(BreakBlock)`
  background-color: ${({ theme }) => theme.palette.accent.main};
  margin-top: ${({ theme }) => theme.spacing(5)};
  margin-bottom: ${({ theme }) => theme.spacing(5)};

  ${({ theme }) => theme.breakpoints.up('md')} {
    padding: ${({ theme }) => theme.spacing(10)};
  }

  .MuiButton-root,
  .MuiButton-root:hover {
    background-color: ${({ theme }) => theme.palette.secondary.main};
    color: ${({ theme }) => theme.palette.secondary.contrastText};
  }

  ${BreakBlockHeading} {
    font-size: 2rem;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    ${BreakBlockHeading} {
      font-size: ${({ theme }) => theme.typography.h3.fontSize};
    }
  }
`;
