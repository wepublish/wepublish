import styled from '@emotion/styled';

export const FullWidthContainer = styled('main')<{ backgroundColor?: string }>`
  background-color: ${({ theme, backgroundColor }) =>
    backgroundColor || theme.palette.info.main};
  grid-column: 1 / -1;
`;
