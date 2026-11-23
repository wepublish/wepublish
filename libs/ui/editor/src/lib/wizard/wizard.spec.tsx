import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react';

import { canGoToStep, StepNav, useWizard, WizardStepper } from './wizard';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('canGoToStep', () => {
  const at = (step: number, complete: boolean[], locked = false) => ({
    step,
    complete,
    locked,
  });

  it('stays where it is', () => {
    expect(canGoToStep(1, at(1, [false, false]))).toBe(true);
  });

  it('goes back freely', () => {
    expect(canGoToStep(0, at(2, [true, true]))).toBe(true);
  });

  it('goes forward only over complete steps', () => {
    expect(canGoToStep(2, at(0, [true, false]))).toBe(false);
    expect(canGoToStep(2, at(0, [true, true]))).toBe(true);
    expect(canGoToStep(1, at(0, [true, false]))).toBe(true);
  });

  it('moves nowhere once the work is done', () => {
    expect(canGoToStep(0, at(2, [true, true], true))).toBe(false);
    expect(canGoToStep(2, at(2, [true, true], true))).toBe(true);
  });
});

describe('StepNav', () => {
  afterEach(cleanup);

  it('shows only the sides it is given', () => {
    const onNext = vi.fn();
    render(<StepNav onNext={onNext} />);

    expect(screen.queryByRole('button', { name: 'wizard.back' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'wizard.next' }));
    expect(onNext).toHaveBeenCalled();
  });

  it('holds back next until the step is done', () => {
    render(
      <StepNav
        onBack={() => undefined}
        onNext={() => undefined}
        nextDisabled
      />
    );

    expect(
      (
        screen.getByRole('button', {
          name: 'wizard.next',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
  });
});

describe('WizardStepper', () => {
  afterEach(cleanup);

  it('names every step and lets only the reachable ones be picked', () => {
    const onStep = vi.fn();
    render(
      <WizardStepper
        steps={[
          { title: 'Audience', description: 'who' },
          { title: 'Channel', description: 'how' },
          { title: 'Review', description: 'check' },
        ]}
        step={0}
        canGoTo={target => target <= 1}
        onStep={onStep}
      />
    );

    // A non-linear stepper renders its steps as tabs.
    fireEvent.click(screen.getByRole('tab', { name: /Channel/ }));
    expect(onStep).toHaveBeenCalledWith(1);
    expect(
      (screen.getByRole('tab', { name: /Review/ }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
  });
});

describe('useWizard', () => {
  it('starts at the first step that is not complete yet', () => {
    const { result } = renderHook(() =>
      useWizard({ complete: [true, false, false] })
    );

    expect(result.current.step).toBe(1);
  });

  it('moves on only once the current step is complete', () => {
    const { result, rerender } = renderHook(
      ({ complete }) => useWizard({ complete, initial: 0 }),
      { initialProps: { complete: [false, false] } }
    );

    act(() => result.current.next());
    expect(result.current.step).toBe(0);

    rerender({ complete: [true, false] });
    act(() => result.current.next());
    expect(result.current.step).toBe(1);

    act(() => result.current.back());
    expect(result.current.step).toBe(0);
  });

  it('ignores a jump to a step that cannot be reached yet', () => {
    const { result } = renderHook(() =>
      useWizard({ complete: [true, false, false], initial: 0 })
    );

    act(() => result.current.goTo(2));
    expect(result.current.step).toBe(0);

    act(() => result.current.goTo(1));
    expect(result.current.step).toBe(1);
  });
});
