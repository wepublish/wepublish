import styled from '@emotion/styled';
import { PropsWithChildren, ReactNode } from 'react';

export const DescriptionList = styled.dl`
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(0.5, 2)};
  align-items: baseline;
  margin: ${({ theme }) => theme.spacing(0, 0, 2)};
  font-size: ${({ theme }) => theme.typography.caption.fontSize};

  @container (max-width: 320px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0 0;
  }
`;

const Label = styled.dt`
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

const Value = styled.dd`
  margin: 0;
  min-width: 0;
  overflow-wrap: break-word;
`;

export interface DescriptionListItemProps {
  label?: ReactNode;
}

export function DescriptionListItem({
  label,
  children,
}: PropsWithChildren<DescriptionListItemProps>) {
  return (
    <>
      <Label>{label}</Label>
      <Value>{children}</Value>
    </>
  );
}
