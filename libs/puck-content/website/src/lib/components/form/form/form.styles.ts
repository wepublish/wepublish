import styled from '@emotion/styled';

export const FormElement = styled.form`
  position: relative;
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const NestedFormElement = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const FormContent = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const FormHoneypot = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;
