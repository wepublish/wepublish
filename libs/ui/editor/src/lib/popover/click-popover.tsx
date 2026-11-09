import { Popover, PopoverOrigin } from '@mui/material';
import {
  cloneElement,
  MouseEvent,
  ReactElement,
  ReactNode,
  useId,
  useState,
} from 'react';

export interface ClickPopoverProps {
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
}

export function ClickPopover({
  trigger,
  children,
  anchorOrigin = { vertical: 'bottom', horizontal: 'left' },
  transformOrigin = { vertical: 'top', horizontal: 'left' },
}: ClickPopoverProps) {
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
        'aria-haspopup': 'dialog',
        'aria-expanded': open ? 'true' : 'false',
        'aria-controls': open ? id : undefined,
        onClick: (event: MouseEvent) => {
          trigger.props.onClick?.(event);
          setAnchorEl(event.currentTarget as HTMLElement);
        },
      })}

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={close}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
        slotProps={{
          paper: {
            role: 'dialog',
            'aria-labelledby': triggerId,
            sx: { p: 2, maxWidth: 420 },
          },
        }}
      >
        {typeof children === 'function' ? children(close) : children}
      </Popover>
    </>
  );
}
