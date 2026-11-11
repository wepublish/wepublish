import styled from '@emotion/styled';
import { Button } from '@mui/material';
import { SubscribeBlock } from '@wepublish/block-content/website';
import { PaymentPeriodicity } from '@wepublish/website/api';
import {
  BuilderRouterContext,
  BuilderSubscribeBlockProps,
  SUBSCRIBE_AREAS,
  SubscribeArea,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ZwoelfRadioCard, ZwoelfRadioCards } from './zwoelf-radio-card';
import {
  ZwoelfSubscribeMode,
  ZwoelfSubscribeStep,
  ZwoelfSubscribeStepContext,
} from './zwoelf-subscribe-step-context';

/** Gift subscriptions are still sold in the external shop. */
export const ZWOELF_SHOP_URL = 'https://shop.zwoelf.ch/produkt-kategorie/abos/';

/** Left out while the reader chooses duration and plan. */
export const ZWOELF_STEP_1_HIDDEN_AREAS: readonly SubscribeArea[] = [
  'userForm',
  'paymentPeriodicity',
  'goodie',
  'discountCode',
  'challenge',
  'transactionFee',
  'submit',
];

/** Left out while the reader enters personal data and pays. */
export const ZWOELF_STEP_2_HIDDEN_AREAS: readonly SubscribeArea[] = [
  'periodicity',
  'memberPlans',
  'monthlyAmount',
];

const Wrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(5)};
  align-content: start;
`;

const Section = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
  align-content: start;
`;

const GiftLink = styled(Button)`
  justify-self: start;
` as typeof Button;

const StyledSubscribeBlock = styled(SubscribeBlock)`
  /* the goodie is announced, not chosen, so the section needs no title */
  [data-area='goodie'] > h2 {
    display: none;
  }

  [data-area='goodie']:has(> h2:only-child) {
    display: none;
  }
`;

const findPeriodicity = (query: string | string[] | undefined) =>
  typeof query === 'string' ?
    Object.values(PaymentPeriodicity).find(
      periodicity => periodicity.toLowerCase() === query.toLowerCase()
    )
  : undefined;

/**
 * The zwoelf subscribe page as a wizard: first for whom (gifts go to the shop),
 * the duration and the plan; after "Weiter" the personal data and the payment.
 * The global form stays in charge, it only gets the areas of the current step.
 */
export const ZwoelfSubscribeBlock = (props: BuilderSubscribeBlockProps) => {
  const { t } = useTranslation();
  const {
    elements: { H5, Paragraph },
  } = useWebsiteBuilder();
  const { query } = useContext(BuilderRouterContext);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const startsOnStep2 =
    !!query.memberPlanBySlug &&
    !!findPeriodicity(query.periodicity) &&
    props.memberPlans.some(({ slug }) => slug === query.memberPlanBySlug);

  const [step, setStep] = useState<ZwoelfSubscribeStep>(startsOnStep2 ? 2 : 1);
  const [mode, setMode] = useState<ZwoelfSubscribeMode>('self');
  const previousStep = useRef(step);

  useEffect(() => {
    if (previousStep.current !== step) {
      previousStep.current = step;
      wrapperRef.current?.scrollIntoView?.({
        block: 'start',
        behavior: 'smooth',
      });
    }
  }, [step]);

  const stepContext = useMemo(
    () => ({ step, setStep, mode, setMode }),
    [step, mode]
  );

  if (query.upgradeSubscriptionId) {
    return <StyledSubscribeBlock {...props} />;
  }

  const hiddenAreas =
    mode === 'gift' ? SUBSCRIBE_AREAS
    : step === 1 ? ZWOELF_STEP_1_HIDDEN_AREAS
    : ZWOELF_STEP_2_HIDDEN_AREAS;

  return (
    <ZwoelfSubscribeStepContext value={stepContext}>
      <Wrapper
        ref={wrapperRef}
        className={props.className}
      >
        {step === 1 && (
          <Section data-area="mode">
            <H5 component="h2">{t('zwoelf.subscribe.mode.title')}</H5>

            <ZwoelfRadioCards
              name="zwoelf-subscribe-mode"
              value={mode}
              onChange={(_event, newMode) =>
                setMode(newMode as ZwoelfSubscribeMode)
              }
            >
              <ZwoelfRadioCard
                value="self"
                title={t('zwoelf.subscribe.mode.self')}
                description={t('zwoelf.subscribe.mode.selfDescription')}
              />
              <ZwoelfRadioCard
                value="gift"
                title={t('zwoelf.subscribe.mode.gift')}
                description={t('zwoelf.subscribe.mode.giftDescription')}
              />
            </ZwoelfRadioCards>
          </Section>
        )}

        {mode === 'gift' && (
          <Section data-area="gift">
            <Paragraph gutterBottom={false}>
              {t('zwoelf.subscribe.mode.giftNotice')}
            </Paragraph>

            <GiftLink
              component="a"
              href={ZWOELF_SHOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              size="large"
            >
              {t('zwoelf.subscribe.mode.giftLink')}
            </GiftLink>
          </Section>
        )}

        <StyledSubscribeBlock
          {...props}
          hiddenAreas={hiddenAreas}
          onInvalid={() => setStep(2)}
        />
      </Wrapper>
    </ZwoelfSubscribeStepContext>
  );
};
