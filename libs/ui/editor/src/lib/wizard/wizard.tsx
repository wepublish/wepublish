import {
  Button,
  Stack,
  Step,
  StepButton,
  Stepper,
  Typography,
} from '@mui/material';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdArrowBack, MdArrowForward } from 'react-icons/md';

/**
 * Whether a wizard may jump to `target`: back always, forward only over steps
 * that are complete, and nowhere once the work is done (`locked`) — stepping
 * back would only offer edits that can no longer change anything.
 */
export function canGoToStep(
  target: number,
  {
    step,
    complete,
    locked,
  }: { step: number; complete: boolean[]; locked: boolean }
): boolean {
  if (target === step) {
    return true;
  }

  if (locked) {
    return false;
  }

  if (target < step) {
    return true;
  }

  return complete.slice(step, target).every(Boolean);
}

/**
 * Where a wizard is, and where it may go: `complete` says per step whether
 * its work is done, so the wizard only moves forward over finished steps. It
 * opens at `initial`, or else where the work was left off.
 */
export function useWizard({
  complete,
  initial,
  locked = false,
}: {
  complete: boolean[];
  initial?: number;
  locked?: boolean;
}) {
  const [step, setStep] = useState(() => {
    if (initial !== undefined) {
      return initial;
    }

    const open = complete.findIndex(done => !done);
    return open === -1 ? Math.max(complete.length - 1, 0) : open;
  });

  const canGoTo = (target: number) =>
    target >= 0 &&
    target < complete.length &&
    canGoToStep(target, { step, complete, locked });

  const goTo = (target: number) => {
    if (canGoTo(target)) {
      setStep(target);
    }
  };

  return {
    step,
    canGoTo,
    goTo,
    next: () => goTo(step + 1),
    back: () => goTo(step - 1),
  };
}

/** The steps of a wizard, each one clickable while it can be reached. */
export function WizardStepper({
  steps,
  step,
  canGoTo,
  onStep,
  vertical = false,
}: {
  steps: { title: ReactNode; description?: ReactNode }[];
  step: number;
  canGoTo: (target: number) => boolean;
  onStep: (target: number) => void;
  /** Stacks the steps, for screens too narrow to fit them side by side. */
  vertical?: boolean;
}) {
  return (
    <Stepper
      activeStep={step}
      nonLinear
      orientation={vertical ? 'vertical' : 'horizontal'}
      sx={{ marginTop: 3, marginBottom: 1 }}
    >
      {steps.map(({ title, description }, index) => (
        <Step key={index}>
          <StepButton
            disabled={!canGoTo(index)}
            aria-selected={index === step}
            optional={
              description ?
                <Typography variant="caption">{description}</Typography>
              : undefined
            }
            onClick={() => onStep(index)}
          >
            {title}
          </StepButton>
        </Step>
      ))}
    </Stepper>
  );
}

/** Back/next controls of a wizard. Either side can be left out. */
export function StepNav({
  onBack,
  onNext,
  nextDisabled,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        justifyContent: 'flex-end',
        marginTop: 2,
      }}
    >
      {onBack && (
        <Button
          variant="text"
          startIcon={<MdArrowBack />}
          onClick={onBack}
        >
          {t('wizard.back')}
        </Button>
      )}
      {onNext && (
        <Button
          variant="contained"
          endIcon={<MdArrowForward />}
          disabled={nextDisabled}
          onClick={onNext}
        >
          {t('wizard.next')}
        </Button>
      )}
    </Stack>
  );
}
