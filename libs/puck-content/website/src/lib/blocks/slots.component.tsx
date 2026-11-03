import { ReactNode } from 'react';

import { PuckSlotProps } from './block.types';

export type PuckSlotElementProps = PuckSlotProps & { children?: ReactNode };

export const PuckSlot = ({
  as: As = 'div',
  className,
  style,
  children,
}: PuckSlotElementProps) => (
  <As
    className={className}
    style={style}
  >
    {children}
  </As>
);

export const EmptySlot = (props?: PuckSlotProps) => <PuckSlot {...props} />;
