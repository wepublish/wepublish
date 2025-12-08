import { CSSProperties, PropsWithChildren } from 'react';

export type BuilderContentWrapperProps = PropsWithChildren<{
  className?: string;
  style?: CSSProperties;
  fullWidth?: boolean;
}>;
