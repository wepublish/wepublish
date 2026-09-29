import styled from '@emotion/styled';
import { ReactNode } from 'react';

const Children = styled('div', {
  shouldForwardProp: propName => propName !== 'maxWidth',
})<{ maxWidth: string }>`
  display: flex;
  width: 100%;
  max-width: ${({ maxWidth }) => maxWidth};
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
`;

const NavigationChildren = styled.div`
  display: flex;
  position: sticky;
  top: 0;
  z-index: 10;
  width: 100%;
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
  return (
    <EditorTemplateWrapper>
      <NavigationChildren>{navigationChildren}</NavigationChildren>
      <ChildrenWrapper>
        <Children maxWidth={maxWidth}>{children}</Children>
      </ChildrenWrapper>
    </EditorTemplateWrapper>
  );
}
