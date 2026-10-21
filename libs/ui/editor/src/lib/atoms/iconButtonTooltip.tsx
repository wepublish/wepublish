import { Tooltip } from '@mui/material';
import { ReactElement } from 'react';

interface IconButtonTooltipProps {
  children: ReactElement;
  caption: string;
}

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
