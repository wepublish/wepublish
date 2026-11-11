import { IconButtonTooltip } from '@wepublish/ui/editor';
import { ReactElement } from 'react';

/**
 * A tooltip that also explains a disabled action: a disabled button gets no
 * pointer events, so the tooltip listens on a wrapper around it. The button
 * keeps its action name; the reason is its description.
 */
export function ReasonTooltip({
  reason,
  children,
}: {
  reason: string;
  children: ReactElement;
}) {
  return (
    <IconButtonTooltip
      caption={reason}
      describeChild
    >
      {/* aligned like the unwrapped icon buttons beside it */}
      <span style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
        {children}
      </span>
    </IconButtonTooltip>
  );
}
