import styled from '@emotion/styled';
import { Alert, Button } from '@mui/material';
import type { SectionComponentProps } from '@wepublish/form/editor';
import { InfoTooltip } from '@wepublish/ui/editor';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdAutoFixHigh, MdCheck } from 'react-icons/md';

import { useRefuseTrial } from './memberplan-fields';
import type { MemberPlanFormValues } from './memberplan.schema';

const TrialAction = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export function MemberPlanTrial({ readOnly }: SectionComponentProps) {
  const { t } = useTranslation();
  const { getValues, setValue } = useFormContext<MemberPlanFormValues>();
  const refuseTrial = useRefuseTrial();
  const [extendable, maxCount] = useWatch<
    MemberPlanFormValues,
    ['extendable', 'maxCount']
  >({ name: ['extendable', 'maxCount'] });

  if (!extendable && !!maxCount) {
    return (
      <Alert
        icon={<MdCheck />}
        severity="success"
      >
        {t('memberplanForm.trialMemberplanAlert')}
      </Alert>
    );
  }

  const configureTrial = () => {
    if (refuseTrial(getValues('availablePaymentMethods'))) {
      return;
    }

    setValue('maxCount', 1, { shouldDirty: true });
    setValue('extendable', false, { shouldDirty: true });
  };

  return (
    <TrialAction>
      <Button
        variant="outlined"
        color="success"
        startIcon={<MdAutoFixHigh />}
        disabled={readOnly}
        onClick={configureTrial}
      >
        {t('memberplanForm.configureTrialBtn')}
      </Button>
      <InfoTooltip text={t('memberplanForm.configureTrialHelp')} />
    </TrialAction>
  );
}
