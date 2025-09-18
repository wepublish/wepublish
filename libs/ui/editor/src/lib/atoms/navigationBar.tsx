import styled from '@emotion/styled';
import { ReactNode } from 'react';

const RightChildren = styled.div`
  display: flex;
  flex-grow: 1;
  flex-basis: 0;
  align-items: flex-start;
  justify-content: flex-end;
`;

const CenterChildren = styled.div`
  display: flex;
  margin: 0 10px;
`;

const LeftChildren = styled.div`
  display: flex;
  flex-grow: 1;
  flex-basis: 0;
  align-items: flex-start;
`;

const NavigationBarWrapper = styled.div`
  display: flex;
  overflow: hidden;
  width: 100%;
  background-color: white;
`;

export interface NavigationBarProps {
  leftChildren?: ReactNode;
  rightChildren?: ReactNode;
  centerChildren?: ReactNode;
}

export function NavigationBar({
  leftChildren,
  rightChildren,
  centerChildren,
}: NavigationBarProps) {
  return (
    <NavigationBarWrapper>
      <LeftChildren>{leftChildren}</LeftChildren>
      <CenterChildren>{centerChildren}</CenterChildren>
      <RightChildren>{rightChildren}</RightChildren>
    </NavigationBarWrapper>
  );
}
