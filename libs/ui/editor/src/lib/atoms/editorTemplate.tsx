import styled from '@emotion/styled';
import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react';

const Children = styled('div', {
  shouldForwardProp: propName => propName !== 'maxWidth',
})<{ maxWidth: string }>`
  display: flex;
  width: 80%;
  max-width: ${({ maxWidth }) => maxWidth};

  @media (max-width: 899px) {
    width: 100%;
  }
`;

const ChildrenWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding-top: 40px;
  padding-bottom: 60px;
  padding-left: 40px;
  padding-right: 40px;

  @media (max-width: 899px) {
    padding: 16px 12px 40px;
  }
`;

const NavigationChildren = styled.div`
  display: flex;
  position: sticky;
  top: 0;
  z-index: 10;
  margin: calc(-1 * var(--wep-page-padding-top, 0px))
    calc(-1 * var(--wep-page-padding-x, 0px)) 0;
`;

const EditorTemplateWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
`;

export interface EditorTemplateProps {
  navigationChildren?: ReactNode;
  children?: ReactNode;
  maxWidth?: string;
}

export function EditorTemplate({
  children,
  navigationChildren,
  maxWidth = '1220px',
}: EditorTemplateProps) {
  const navigationRef = useRef<HTMLDivElement>(null);
  const [navigationHeight, setNavigationHeight] = useState(0);

  useEffect(() => {
    const navigation = navigationRef.current;

    if (!navigation || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setNavigationHeight(
        entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height
      );
    });
    observer.observe(navigation);

    return () => observer.disconnect();
  }, []);

  return (
    <EditorTemplateWrapper
      style={{ '--wep-sticky-top': `${navigationHeight}px` } as CSSProperties}
    >
      <NavigationChildren ref={navigationRef}>
        {navigationChildren}
      </NavigationChildren>
      <ChildrenWrapper>
        <Children maxWidth={maxWidth}>{children}</Children>
      </ChildrenWrapper>
    </EditorTemplateWrapper>
  );
}
