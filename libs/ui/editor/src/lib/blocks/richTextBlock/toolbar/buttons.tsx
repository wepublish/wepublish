import styled from '@emotion/styled';
import { useEffect, useRef } from 'react';
import { OverlayTriggerHandle } from 'rsuite/esm/Picker';
import { useSlate } from 'slate-react';

import {
  SubMenuButton,
  SubMenuButtonProps,
  ToolbarButton,
  ToolbarButtonProps,
  ToolbarIconButton,
  ToolbarIconButtonProps,
} from '../../../atoms/toolbar';
import { Format } from '../editor/formats';
import { WepublishEditor } from '../editor/wepublishEditor';

const SubMenu = styled(SubMenuButton)`
  height: 20px;
  width: 20px;
`;

interface FormatBlockIconButtonProps extends ToolbarIconButtonProps {
  readonly icon: React.ReactElement;
  readonly format: Format;
}

export function FormatIconButton({ icon, format }: FormatBlockIconButtonProps) {
  const editor = useSlate();

  return (
    <ToolbarIconButton
      icon={icon}
      active={WepublishEditor.isFormatActive(editor, format)}
      onMouseDown={e => {
        e.preventDefault();
        WepublishEditor.toggleFormat(editor, format);
      }}
    />
  );
}

interface FormatBlockButtonProps extends ToolbarButtonProps {
  readonly format: Format;
}

export function FormatButton({ format, children }: FormatBlockButtonProps) {
  const editor = useSlate();

  return (
    <ToolbarButton
      active={WepublishEditor.isFormatActive(editor, format)}
      onMouseDown={e => {
        e.preventDefault();
        WepublishEditor.toggleFormat(editor, format);
      }}
    >
      {children}
    </ToolbarButton>
  );
}

interface EditorSubMenuButtonProps extends SubMenuButtonProps {
  editorHasFocus: boolean;
}

export function EditorSubMenuButton({
  editorHasFocus,
  children,
  ...props
}: EditorSubMenuButtonProps) {
  const triggerRef = useRef<OverlayTriggerHandle>(null);

  useEffect(() => {
    if (!editorHasFocus && triggerRef.current) triggerRef.current!.close();
  }, [editorHasFocus]);

  return (
    <SubMenu
      {...props}
      ref={triggerRef}
    >
      {children}
    </SubMenu>
  );
}
