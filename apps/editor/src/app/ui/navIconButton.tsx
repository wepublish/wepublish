import styled from '@emotion/styled';
import { IconButton } from '@mui/material';

export const NavIconButton = styled(IconButton)`
  && {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    color: var(--wep-nav-text);
  }

  &&:hover {
    background-color: var(--wep-nav-hover-bg);
    color: ${({ theme }) => theme.vars.palette.text.primary};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;
