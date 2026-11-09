import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { canGoToStep, StepNav, WizardStepper } from './step-nav';

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

    expect(screen.queryByRole('button', { name: 'mailSend.back' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'mailSend.next' }));
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
          name: 'mailSend.next',
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
