import {
  Button,
  Stack,
  Step,
  StepButton,
  Stepper,
  Typography,
} from '@mui/material';
import { ReactNode } from 'react';
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

/** The steps of a wizard, each one clickable while it can be reached. */
export function WizardStepper({
  steps,
  step,
  canGoTo,
  onStep,
}: {
  steps: { title: ReactNode; description: ReactNode }[];
  step: number;
  canGoTo: (target: number) => boolean;
  onStep: (target: number) => void;
}) {
  return (
    <Stepper
      activeStep={step}
      nonLinear
      sx={{ marginTop: 3, marginBottom: 1 }}
    >
      {steps.map(({ title, description }, index) => (
        <Step key={index}>
          <StepButton
            disabled={!canGoTo(index)}
            optional={<Typography variant="caption">{description}</Typography>}
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
          {t('mailSend.back')}
        </Button>
      )}
      {onNext && (
        <Button
          variant="contained"
          endIcon={<MdArrowForward />}
          disabled={nextDisabled}
          onClick={onNext}
        >
          {t('mailSend.next')}
        </Button>
      )}
    </Stack>
  );
}
