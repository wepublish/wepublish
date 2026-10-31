import styled from '@emotion/styled';

/** The login page: title above the login form, centred. */
export const LoginWrapper = styled('div')`
  display: grid;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(5)};
`;
