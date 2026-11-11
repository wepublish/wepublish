import { Tooltip } from '@mui/material';
import { ReactElement } from 'react';

interface IconButtonTooltipProps {
  children: ReactElement;
  caption: string;
  describeChild?: boolean;
}

export function IconButtonTooltip({
  children,
  caption,
  describeChild,
}: IconButtonTooltipProps) {
  return (
    <Tooltip
      title={caption}
      placement="top"
      describeChild={describeChild}
    >
      {children}
    </Tooltip>
  );
}
