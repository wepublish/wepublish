import { ReactNode, ScriptHTMLAttributes } from 'react';

export const TEST_SCRIPT_TEST_ID = 'test-script';

export const TestScript = ({
  src,
  id,
}: { children?: ReactNode } & ScriptHTMLAttributes<HTMLScriptElement>) => (
  <div
    data-testid={TEST_SCRIPT_TEST_ID}
    data-src={src}
    data-id={id}
    hidden
  />
);

export const TestHead = ({ children }: { children: ReactNode }) => children;
