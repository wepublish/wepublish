import styled from '@emotion/styled';
import { ReactNode } from 'react';

export interface DescriptionListProps {
  label?: ReactNode;
  children?: ReactNode;
}

const List = styled.dl`
  font-size: 12px;
  margin: 0 auto;
`;

const ListItem = styled.div`
  display: flex;
  margin-bottom: 10px;
`;

const Label = styled.dt`
  color: gray;
  flex-grow: 1;
`;

const ChildrenWrapper = styled.dd`
  margin-left: 20px;
`;

export function DescriptionList({ children }: DescriptionListProps) {
  return <List>{children}</List>;
}

export function DescriptionListItem({ label, children }: DescriptionListProps) {
  return (
    <ListItem>
      <Label>{label}</Label>
      <ChildrenWrapper>{children}</ChildrenWrapper>
    </ListItem>
  );
}
