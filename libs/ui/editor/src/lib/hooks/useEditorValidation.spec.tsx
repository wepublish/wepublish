import { render, screen } from '@testing-library/react';
import { MutableRefObject, ReactNode, useRef } from 'react';

import {
  AggregatedValidation,
  EditorValidationProvider,
  useRegisterValidator,
} from './useEditorValidation';

function FailingBlock({ withTarget }: { withTarget: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useRegisterValidator(
    'block',
    () => ({ ok: false, summary: 'Block is incomplete' }),
    withTarget ? ref : undefined
  );

  return (
    <div ref={ref}>
      <span>Block</span>
      <input aria-label="Block title" />
    </div>
  );
}

function FocusableBlock() {
  const ref = useRef<HTMLButtonElement>(null);

  useRegisterValidator('button-block', () => ({ ok: false }), ref);

  return <button ref={ref}>Fix me</button>;
}

const runAll = (ui: ReactNode) => {
  const runAllRef: MutableRefObject<() => AggregatedValidation> = {
    current: () => ({ ok: true, failures: [] }),
  };

  render(
    <EditorValidationProvider runAllRef={runAllRef}>
      {ui}
    </EditorValidationProvider>
  );

  return runAllRef.current();
};

describe('useRegisterValidator', () => {
  it('reports failures with their summary', () => {
    const result = runAll(<FailingBlock withTarget={false} />);

    expect(result.ok).toBe(false);
    expect(result.failures).toEqual([
      expect.objectContaining({ id: 'block', summary: 'Block is incomplete' }),
    ]);
  });

  it('lets the editor move focus into the first failing block', () => {
    const result = runAll(<FailingBlock withTarget />);

    result.failures[0].focus?.();

    expect(screen.getByRole('textbox', { name: 'Block title' })).toHaveFocus();
  });

  it('focuses the target itself when it can take focus', () => {
    const result = runAll(<FocusableBlock />);

    result.failures[0].focus?.();

    expect(screen.getByRole('button', { name: 'Fix me' })).toHaveFocus();
  });

  it('offers no focus target when the block registered none', () => {
    const result = runAll(<FailingBlock withTarget={false} />);

    expect(result.failures[0].focus).toBeUndefined();
  });
});
