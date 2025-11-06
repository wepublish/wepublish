import { BlockProps } from '../atoms';
import { FlexBlockValue } from './types';

export const FlexBlock = ({
  value,
  onChange,
  autofocus,
}: BlockProps<FlexBlockValue>) => {
  console.log('Rendering FlexBlock with value:', value);

  return (
    <div>
      <h2>{'Der FlexBlock kommt hier hin.'}</h2>
      <textarea
        autoFocus={autofocus}
        defaultValue={JSON.stringify(value, null, 2)}
        onChange={e => {
          e.stopPropagation();
          e.preventDefault();
          console.log('Textarea change:');
          return void 0;
        }}
        onBlur={e => {
          console.log('onblur');
          try {
            const parsedValue = JSON.parse(e.target.value);
            onChange(parsedValue);
          } catch (error) {
            console.error('Invalid JSON:', error);
          }
        }}
        style={{ width: '100%', height: '600px' }}
      />
    </div>
  );
};
