import { BlockProps } from '../atoms';
import { FlexBlockValue } from './types';

export const FlexBlock = ({
  value,
  onChange,
  autofocus,
}: BlockProps<FlexBlockValue>) => {
  return (
    <div>
      <h2>{'Der FlexBlock kommt hier hin.'}</h2>
    </div>
  );
};
