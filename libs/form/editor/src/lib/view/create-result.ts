import type { ReactNode } from 'react';

export const hasResult = (result: ReactNode) =>
  result !== null && result !== undefined && result !== false;
