import styled from '@emotion/styled';
import { UserForm } from '@wepublish/authentication/website';

export const ReflektUserForm = styled(UserForm)`
  ${({ theme }) => theme.breakpoints.up('md')} {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .MuiOutlinedInput-root {
    border-radius: 0;
  }

  .MuiOutlinedInput-notchedOutline,
  .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline,
  .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: ${({ theme }) => theme.palette.common.black};
  }
`;
