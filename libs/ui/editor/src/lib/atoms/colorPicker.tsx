import styled from '@emotion/styled';
import nanoid from 'nanoid';

interface ColorPickerProps {
  setColor: (color: string) => void;
  currentColor?: string;
  label?: string;
  disabled?: boolean;
}

const Input = styled.input`
  cursor: pointer;
`;

export function ColorPicker({
  setColor,
  currentColor,
  label,
  disabled,
}: ColorPickerProps) {
  const id = nanoid();

  return (
    <>
      {label && <label htmlFor={id}>{label}</label>}
      <Input
        disabled={disabled}
        id={id}
        type="color"
        value={currentColor}
        onChange={e => {
          setColor(e.target.value);
        }}
      />
    </>
  );
}
