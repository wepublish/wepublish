import styled from '@emotion/styled';
import {
  ContextBox,
  ContextBoxAllAbout,
  ContextBoxIcon,
  ContextBoxLine,
} from '@wepublish/block-content/website';

export const BajourContextBox = styled(ContextBox)`
  ${({ theme }) => theme.breakpoints.up('sm')} {
    margin-left: 10%;
    max-width: ${({ theme }) => theme.spacing(38)};
    padding: 0;
  }

  ${ContextBoxAllAbout},
  ${ContextBoxLine},
  ${ContextBoxIcon} {
    color: ${({ theme }) => theme.palette.secondary.dark};
  }

  .MuiButtonBase-root {
    background-color: ${({ theme }) => theme.palette.secondary.dark};
  }
`;
