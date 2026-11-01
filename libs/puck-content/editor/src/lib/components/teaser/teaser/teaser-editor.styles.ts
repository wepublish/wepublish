import styled from '@emotion/styled';

export const TeaserEditorHint = styled('p')`
  margin: 0 0 ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(1, 1.5)};
  border: 1px dashed ${({ theme }) => theme.palette.divider};
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  color: ${({ theme }) => theme.palette.text.secondary};
  font-size: ${({ theme }) => theme.typography.caption.fontSize};
  line-height: ${({ theme }) => theme.typography.caption.lineHeight};
`;
