import styled from '@emotion/styled';

export const ImageEditorPlaceholder = styled('div')`
  display: grid;
  place-items: center;
  aspect-ratio: 16 / 9;
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  background: ${({ theme }) => theme.palette.action.hover};
  color: ${({ theme }) => theme.palette.text.secondary};
  font-size: ${({ theme }) => theme.spacing(6)};
`;
