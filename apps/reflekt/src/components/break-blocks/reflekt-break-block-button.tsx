import { Button as MuiButton } from '@mui/material';
import { BuilderButtonProps } from '@wepublish/website/builder';

import { usePressAnimation } from '../hooks/use-press-animation';

export const ReflektBreakBlockButton = (props: BuilderButtonProps) => {
  const { isPressing, onClick: pressOnClick } = usePressAnimation(
    typeof props.href === 'string' ? props.href : undefined
  );
  const className = [props.className, isPressing && 'is-pressing']
    .filter(Boolean)
    .join(' ');
  return (
    <MuiButton
      {...props}
      disableRipple
      className={className}
      onClick={event => {
        props.onClick?.(event);
        pressOnClick(event);
      }}
    />
  );
};
