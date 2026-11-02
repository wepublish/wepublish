import styled from '@emotion/styled';

export const TagsWrapper = styled('div', {
  shouldForwardProp: prop => prop !== 'empty',
})<{ empty?: boolean }>`
  display: flex;
  flex-flow: row wrap;
  gap: ${({ theme }) => theme.spacing(1)};
  min-height: ${({ empty, theme }) => (empty ? theme.spacing(4) : 'auto')};
`;
