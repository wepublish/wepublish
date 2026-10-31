import { Button, ButtonOwnProps, useForkRef } from '@mui/material';

import { PuckBlockComponent } from '../../../blocks/block.types';

export type ButtonConfigProps = {
  text: string;
  color?: ButtonOwnProps['color'];
  variant?: ButtonOwnProps['variant'];
  elevated?: boolean;
};

export const ButtonRender: PuckBlockComponent<ButtonConfigProps> = ({
  props: { text, variant, color, elevated },
  className,
  ref,
}) => {
  const buttonRef = useForkRef(ref);

  return (
    <Button
      ref={buttonRef}
      className={className}
      variant={variant}
      color={color}
      disableElevation={!elevated}
    >
      {text}
    </Button>
  );
};
