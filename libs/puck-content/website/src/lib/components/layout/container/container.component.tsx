import { Container } from '@mui/material';
import { ComponentProps } from 'react';

import { PuckBlockComponent, PuckSlotValue } from '../../../blocks/block.types';
import { getSlot } from '../../../blocks/slots';

export type ContainerProps = Pick<
  ComponentProps<typeof Container>,
  'maxWidth'
> & {
  content: PuckSlotValue;
};

export const ContainerRender: PuckBlockComponent<ContainerProps> = ({
  props: { maxWidth },
  slots,
  className,
}) => (
  <Container
    className={className}
    maxWidth={maxWidth}
  >
    {getSlot(slots, 'content')()}
  </Container>
);
