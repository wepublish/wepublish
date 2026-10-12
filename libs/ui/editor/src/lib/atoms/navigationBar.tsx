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

  @media (max-width: 899px) {
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    overflow: visible;
    border-bottom: 1px solid var(--rs-border-primary);

    > * {
      flex: 0 1 auto;
      margin: 0;
    }

    > :nth-child(1) {
      order: 1;
    }

    > :nth-child(3) {
      order: 2;
      margin-left: auto;
    }

    > :nth-child(2) {
      order: 3;
      flex: 1 1 100%;
      justify-content: center;
      text-align: center;
    }
  }
  background-color: var(--wep-content-bg, var(--rs-bg-card));
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
