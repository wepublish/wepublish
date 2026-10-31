import styled from '@emotion/styled';

export const FormFieldWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(1)};
  min-width: 0;
`;
