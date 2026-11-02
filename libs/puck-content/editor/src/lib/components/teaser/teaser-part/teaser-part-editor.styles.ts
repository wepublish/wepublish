import styled from '@emotion/styled';

export const TeaserPartPlaceholder = styled('p')`
  margin: 0;
  padding: ${({ theme }) => theme.spacing(0.5, 1)};
  border: 1px dashed ${({ theme }) => theme.palette.divider};
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  color: ${({ theme }) => theme.palette.text.disabled};
  font-size: ${({ theme }) => theme.typography.caption.fontSize};
  line-height: ${({ theme }) => theme.typography.caption.lineHeight};
`;
