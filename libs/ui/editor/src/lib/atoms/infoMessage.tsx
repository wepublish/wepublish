import styled from '@emotion/styled';
import { ReactNode } from 'react';

export interface InfoMessageProps {
  messageType: InfoColor;
  message: ReactNode;
}

export enum InfoColor {
  warning = '#fffaf2',
  error = '#fff2f2',
  white = '#ffffff',
}

const Message = styled.div<{ backgroundColor: InfoColor }>`
  border-radius: 8px;
  padding: 0px 6px;
  background-color: ${({ backgroundColor }) => backgroundColor};
`;

export function InfoMessage({
  messageType = InfoColor.white,
  message,
}: InfoMessageProps) {
  return <Message backgroundColor={messageType}>{message}</Message>;
}
