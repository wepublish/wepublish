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
  padding: 24px 16px;
  background:
    radial-gradient(
      40rem 30rem at 12% 8%,
      rgb(240 140 31 / 14%),
      transparent 70%
    ),
    radial-gradient(
      36rem 28rem at 90% 12%,
      rgb(52 214 144 / 13%),
      transparent 70%
    ),
    radial-gradient(
      44rem 32rem at 50% 105%,
      rgb(4 196 217 / 14%),
      transparent 70%
    ),
    var(--rs-body);

  .rs-theme-dark & {
    background:
      radial-gradient(
        40rem 30rem at 12% 8%,
        rgb(240 140 31 / 9%),
        transparent 70%
      ),
      radial-gradient(
        36rem 28rem at 90% 12%,
        rgb(52 214 144 / 8%),
        transparent 70%
      ),
      radial-gradient(
        44rem 32rem at 50% 105%,
        rgb(4 196 217 / 10%),
        transparent 70%
      ),
      var(--rs-body);
  }
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
  background-color: var(--rs-bg-card);
  border: 1px solid var(--wep-shell-border, var(--rs-border-primary));
  border-radius: 16px;
  box-shadow: var(--wep-elevated-shadow, 0 2px 4px 0 rgba(0, 0, 0, 0.2));

  .rs-btn[type='submit'] {
    width: 100%;
    height: 42px;
  }

  @media (max-width: 640px) {
    padding: 28px 20px;
  }
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
