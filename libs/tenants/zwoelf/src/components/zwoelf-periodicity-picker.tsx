import styled from '@emotion/styled';
import {
  formatRenewalPeriod,
  getPeriodicityLabel,
} from '@wepublish/membership/website';
import { PaymentPeriodicity } from '@wepublish/website/api';
import {
  BuilderPeriodicityPickerProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { ZwoelfRadioCard, ZwoelfRadioCards } from './zwoelf-radio-card';

const PeriodicityWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
`;

/**
 * The "Laufzeit wählen" step: one card per duration. A card tells what the
 * duration includes, taken from the label of the plan's pricing row or, when
 * there is none, from the goodies limited to that duration.
 */
export const ZwoelfPeriodicityPicker = ({
  periodicities,
  onChange,
  value,
  className,
  name,
  memberPlan,
}: BuilderPeriodicityPickerProps) => {
  const { t } = useTranslation();
  const {
    elements: { H5 },
  } = useWebsiteBuilder();
  const show = !!periodicities && periodicities.length > 1;

  useEffect(() => {
    if (periodicities?.length && !value) {
      onChange(periodicities[0]);
    }
  }, [periodicities, onChange, value]);

  if (!show) {
    return null;
  }

  const describe = (periodicity: PaymentPeriodicity) => {
    const label = getPeriodicityLabel(memberPlan, periodicity);

    if (label) {
      return label;
    }

    const goodies =
      memberPlan?.goodies
        ?.filter(goodie => goodie.paymentPeriodicities.includes(periodicity))
        .map(goodie => goodie.name) ?? [];

    return goodies.length ?
        t('zwoelf.subscribe.periodicity.includes', {
          goodies: goodies.join(', '),
        })
      : null;
  };

  return (
    <PeriodicityWrapper className={className}>
      <H5 component="h2">{t('zwoelf.subscribe.periodicity.title')}</H5>

      <ZwoelfRadioCards
        name={name}
        value={value ?? ''}
        onChange={(_event, periodicity) =>
          onChange(periodicity as PaymentPeriodicity)
        }
      >
        {periodicities.map(periodicity => (
          <ZwoelfRadioCard
            key={periodicity}
            value={periodicity}
            title={t(`zwoelf.subscribe.periodicity.${periodicity}`, {
              defaultValue: formatRenewalPeriod(periodicity),
            })}
            description={describe(periodicity)}
          />
        ))}
      </ZwoelfRadioCards>
    </PeriodicityWrapper>
  );
};
