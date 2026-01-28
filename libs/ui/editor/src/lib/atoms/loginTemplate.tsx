import styled from '@emotion/styled';
import React, { ReactNode } from 'react';

export interface LoginTemplateProps {
  readonly children?: ReactNode;
  readonly backgroundChildren?: ReactNode;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  min-height: 100vh;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  z-index: 1;
  width: 100%;
  max-width: 560px;
  padding: 40px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2);
`;

const Background = styled.div`
  margin-bottom: 20px;
  z-index: 0;
`;

export function LoginTemplate({
  backgroundChildren,
  children,
}: LoginTemplateProps) {
  return (
    <Wrapper>
      {backgroundChildren && <Background>{backgroundChildren}</Background>}
      <Content>{children}</Content>
    </Wrapper>
  );
}
