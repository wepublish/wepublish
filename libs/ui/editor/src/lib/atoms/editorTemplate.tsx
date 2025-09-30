import styled from '@emotion/styled';
import { ReactNode } from 'react';

const Children = styled.div`
  display: flex;
  width: 100%;
  max-width: 1220px;
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
}

export function EditorTemplate({
  children,
  navigationChildren,
}: EditorTemplateProps) {
  return (
    <EditorTemplateWrapper>
      <NavigationChildren>{navigationChildren}</NavigationChildren>
      <ChildrenWrapper>
        <Children>{children}</Children>
      </ChildrenWrapper>
    </EditorTemplateWrapper>
  );
}
