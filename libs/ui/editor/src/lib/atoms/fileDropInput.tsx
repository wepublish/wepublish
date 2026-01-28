import styled from '@emotion/styled';
import React, { useRef, useState } from 'react';

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
  border-radius: 3px;
  border-style: dashed;
  border-width: 3px;
  position: relative;
  font-size: 16px;
  text-align: center;
  border-color: ${({ dragging }) => (dragging ? '#3498ff' : '#004299')};
  color: ${({ dragging }) => (dragging ? '#3498ff' : '#004299')};
  fill: ${({ dragging }) => (dragging ? '#3498ff' : '#004299')};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
`;

export interface FileDropInputProps {
  disabled?: boolean;

  icon?: React.ReactElement;
  text?: string;

  onDrop: (fileList: File[]) => void;
}

export function FileDropInput({
  disabled = false,
  onDrop,
  icon,
  text,
}: FileDropInputProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDragIn(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();

    setDragging(true);
  }

  function handleDragOut(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();

    setDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();

    setDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDrop(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
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
      {icon && icon}
      <div>{text}</div>
      <Input
        ref={inputRef}
        type="file"
        value={''}
        onChange={handleInputChange}
        disabled={disabled}
      />
    </FileDropInputWrapper>
  );
}
