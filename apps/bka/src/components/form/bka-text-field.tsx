import styled from '@emotion/styled';
import { TextField } from '@mui/material';

export const BkaTextField = styled(TextField)`
  & .MuiOutlinedInput-root {
    gap: ${({ theme }) => theme.spacing(1)};
    border-radius: 4px;
    font-family: ${({ theme }) => theme.typography.h6.fontFamily};
    font-size: ${({ theme }) => theme.typography.h6.fontSize};
    line-height: ${({ theme }) => theme.typography.h6.lineHeight};
  }

  & .MuiOutlinedInput-notchedOutline {
    border: 1px solid ${({ theme }) => theme.palette.common.black};
  }

  & .MuiOutlinedInput-input {
    height: auto;
    padding: 7px 16px 7px 0;
  }

  & .MuiInputLabel-outlined {
    font-family: ${({ theme }) => theme.typography.body1.fontFamily};

    &:not(.MuiInputLabel-shrink) {
      transform: translate(14px, 9px) scale(1);
    }
  }

  & .MuiOutlinedInput-input::placeholder {
    color: ${({ theme }) => theme.palette.grey[600]};
    opacity: 1;
  }
`;
