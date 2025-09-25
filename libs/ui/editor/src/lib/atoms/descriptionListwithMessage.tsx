import { ReactNode } from 'react';

import { DescriptionListItem } from './descriptionList';
import { InfoColor, InfoMessage } from './infoMessage';

export interface DescriptionListWithMessageItemProps {
  label?: ReactNode;
  children?: ReactNode;
  message: ReactNode;
  messageType: InfoColor;
}

export function DescriptionListItemWithMessage({
  label,
  children,
  message,
  messageType,
}: DescriptionListWithMessageItemProps) {
  return (
    <DescriptionListItem label={label}>
      {children || (
        <InfoMessage
          messageType={messageType}
          message={message}
        ></InfoMessage>
      )}
    </DescriptionListItem>
  );
}
