import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import type { CommandSuggestion } from './command-suggestions';
import { MenuItem, Popper } from '@mui/material';

export const CommandList = forwardRef<
  Pick<ReturnType<CommandSuggestion['render']>, 'onKeyDown'>,
  Parameters<ReturnType<CommandSuggestion['render']>['onStart']>[0]
>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => props.items[index]?.command(props);

  const upHandler = () => {
    setSelectedIndex(
      (selectedIndex + props.items.length - 1) % props.items.length
    );
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  return (
    <Popper
      open
      anchorEl={props.decorationNode}
      placement={'bottom-start'}
      modifiers={[{ name: 'shift' }, { name: 'flip' }]}
      sx={{ bgcolor: 'background.default', border: 1, zIndex: 10000 }}
    >
      {props.items.length ?
        props.items.map((item, index) => (
          <MenuItem
            key={index}
            onClick={() => selectItem(index)}
            selected={index === selectedIndex}
            disableRipple
          >
            {item.title}
          </MenuItem>
        ))
      : <MenuItem>No result</MenuItem>}
    </Popper>
  );
});
