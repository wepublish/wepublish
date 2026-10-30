import styled from '@emotion/styled';
import {
  ChangeEvent,
  DragEvent,
  ReactElement,
  ReactNode,
  useRef,
  useState,
} from 'react';

const Input = styled.input`
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  opacity: 0;
`;

const FileDropInputWrapper = styled.div<{
  dragging: boolean;
  disabled: boolean;
}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding-top: 20px;
  padding-bottom: 20px;
  padding-left: 20px;
  padding-right: 20px;
  border-radius: ${({ theme }) => theme.shape.borderRadius + 'px'};
  border-style: dashed;
  border-width: 1px;
  position: relative;
  font-size: ${({ theme }) => theme.typography.body2.fontSize};
  text-align: center;
  transition: ${({ theme }) =>
    theme.transitions.create(['border-color', 'background-color', 'color'])};
  border-color: ${({ dragging, theme }) =>
    dragging ?
      theme.vars.palette.primary.main
    : theme.vars.palette.action.disabled};
  background-color: ${({ dragging, theme }) =>
    dragging ?
      `rgba(${theme.vars.palette.primary.mainChannel} / 0.08)`
    : theme.vars.palette.background.default};
  color: ${({ dragging, theme }) =>
    dragging ?
      theme.vars.palette.primary.main
    : theme.vars.palette.text.secondary};
  fill: currentColor;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};

  &:hover {
    border-color: ${({ theme }) => theme.vars.palette.text.primary};
    color: ${({ theme }) => theme.vars.palette.text.primary};
  }
`;

export interface FileDropInputProps {
  disabled?: boolean;
  accept?: string;

  icon?: ReactElement;
  text?: string;
  children?: ReactNode;

  onDrop: (fileList: File[]) => void;
}

export function FileDropInput({
  disabled = false,
  accept,
  onDrop,
  icon,
  text,
  children,
}: FileDropInputProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDragIn(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();

    setDragging(true);
  }

  function handleDragOut(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();

    setDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();

    setDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDrop(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      onDrop(Array.from(e.target.files));
    }
  }

  return (
    <FileDropInputWrapper
      dragging={dragging}
      disabled={disabled}
      onDrop={!disabled ? handleDrop : undefined}
      onDragOver={!disabled ? handleDragIn : undefined}
      onDragLeave={!disabled ? handleDragOut : undefined}
      onClick={() => inputRef.current!.click()}
    >
      {children ?? (
        <>
          {icon && icon}
          <div>{text}</div>
        </>
      )}
      <Input
        ref={inputRef}
        type="file"
        value={''}
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled}
      />
    </FileDropInputWrapper>
  );
}
