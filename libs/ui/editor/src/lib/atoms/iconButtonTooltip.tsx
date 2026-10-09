import { Tooltip } from '@mui/material';
import { ReactElement } from 'react';

interface IconButtonTooltipProps {
  children: ReactElement;
  caption: string;
}

/**
 * Labels an icon-only button. MUI's `Tooltip` already opens on hover and on
 * keyboard focus, so rsuite's explicit `trigger` list has no counterpart.
 */
export function IconButtonTooltip({
  children,
  caption,
}: IconButtonTooltipProps) {
  return (
    <Tooltip
      title={caption}
      placement="top"
    >
      {children}
    </Tooltip>
  );
}
