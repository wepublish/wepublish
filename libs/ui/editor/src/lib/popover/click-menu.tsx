import { Menu, MenuProps, PopoverOrigin } from '@mui/material';
import {
  cloneElement,
  MouseEvent,
  ReactElement,
  ReactNode,
  useId,
  useState,
} from 'react';

export interface ClickMenuProps {
  trigger: ReactElement<{
    id?: string;
    onClick?: (event: MouseEvent) => void;
    'aria-haspopup'?: string;
    'aria-expanded'?: string;
    'aria-controls'?: string;
  }>;
  children: ReactNode | ((close: () => void) => ReactNode);
  anchorOrigin?: PopoverOrigin;
  transformOrigin?: PopoverOrigin;
  slotProps?: MenuProps['slotProps'];
}

export function ClickMenu({
  trigger,
  children,
  anchorOrigin = { vertical: 'bottom', horizontal: 'left' },
  transformOrigin = { vertical: 'top', horizontal: 'left' },
  slotProps,
}: ClickMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const id = useId();
  const generatedTriggerId = useId();
  const triggerId = trigger.props.id ?? generatedTriggerId;
  const open = Boolean(anchorEl);
  const close = () => setAnchorEl(null);

  return (
    <>
      {cloneElement(trigger, {
        id: triggerId,
        'aria-haspopup': 'menu',
        'aria-expanded': open ? 'true' : 'false',
        'aria-controls': open ? id : undefined,
        onClick: (event: MouseEvent) => {
          trigger.props.onClick?.(event);
          setAnchorEl(event.currentTarget as HTMLElement);
        },
      })}

      <Menu
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={close}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
        slotProps={{
          ...slotProps,
          list:
            typeof slotProps?.list === 'function' ?
              slotProps.list
            : { 'aria-labelledby': triggerId, ...slotProps?.list },
        }}
      >
        {typeof children === 'function' ? children(close) : children}
      </Menu>
    </>
  );
}
