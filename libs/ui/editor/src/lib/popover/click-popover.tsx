import { Popover, PopoverOrigin } from '@mui/material';
import { cloneElement, ReactElement, ReactNode, useId, useState } from 'react';

export interface ClickPopoverProps {
  /** Element that opens the popover. Gets the click handler attached. */
  trigger: ReactElement<{ onClick?: (event: React.MouseEvent) => void }>;
  /** Content, or a render function receiving a callback that closes it. */
  children: ReactNode | ((close: () => void) => ReactNode);
  anchorOrigin?: PopoverOrigin;
  transformOrigin?: PopoverOrigin;
}

/**
 * A popover that opens on click.
 *
 * MUI's `Popover` is controlled — it wants `open`, `anchorEl` and `onClose` —
 * so this holds that state in one place rather than repeating it at every
 * call site that used to be a click-triggered rsuite `Whisper`.
 */
export function ClickPopover({
  trigger,
  children,
  anchorOrigin = { vertical: 'bottom', horizontal: 'left' },
  transformOrigin = { vertical: 'top', horizontal: 'left' },
}: ClickPopoverProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const id = useId();
  const open = Boolean(anchorEl);
  const close = () => setAnchorEl(null);

  return (
    <>
      {cloneElement(trigger, {
        onClick: (event: React.MouseEvent) => {
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
        slotProps={{ paper: { sx: { p: 2, maxWidth: 420 } } }}
      >
        {typeof children === 'function' ? children(close) : children}
      </Popover>
    </>
  );
}
