import { Button, ButtonOwnProps } from '@mui/material';
import { PuckComponent } from '@puckeditor/core';

export type ButtonConfigProps = {
  text: string;
  color?: ButtonOwnProps['color'];
  variant?: ButtonOwnProps['variant'];
  elevated?: boolean;
};

export const ButtonRender: PuckComponent<ButtonConfigProps> = ({
  text,
  variant,
  color,
  elevated,
  puck,
}) => (
  <Button
    ref={puck.dragRef}
    variant={variant}
    color={color}
    disableElevation={!elevated}
  >
    {text}
  </Button>
);
