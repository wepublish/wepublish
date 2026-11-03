import { PuckBlockComponent } from '../../../blocks/block.types';

export type FormHiddenProps = {
  name: string;
  value: string;
};

export const FormHiddenRender: PuckBlockComponent<FormHiddenProps> = ({
  className,
  props: { name, value },
}) => (
  <input
    type="hidden"
    className={className}
    name={name}
    value={value}
  />
);
