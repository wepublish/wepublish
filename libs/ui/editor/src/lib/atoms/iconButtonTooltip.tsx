import { ReactElement } from 'react';
import { Tooltip, Whisper } from 'rsuite';

interface IconButtonTooltipProps {
  children: ReactElement;
  caption: string;
}

export function IconButtonTooltip({
  children,
  caption,
}: IconButtonTooltipProps) {
  return (
    <Whisper
      placement="top"
      trigger="hover"
      speaker={<Tooltip>{caption}</Tooltip>}
    >
      {children}
    </Whisper>
  );
}
