import styled from '@emotion/styled';
import {
  FullAvailablePaymentMethodFragment,
  FullMemberPlanFragment,
  PaymentPeriodicity,
} from '@wepublish/editor/api';
import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdPriceCheck } from 'react-icons/md';
import { Col, Form, Nav, Panel, Row, Toggle } from 'rsuite';
import {
  CurrencyInput,
  ListValue,
  PAYMENT_PERIODICITY_MONTHS,
} from '@wepublish/ui/editor';

const { HelpText } = Form;

const PERIODICITY_ORDER = [
  PaymentPeriodicity.Quarterly,
  PaymentPeriodicity.Biannual,
  PaymentPeriodicity.Yearly,
  PaymentPeriodicity.Biennial,
  PaymentPeriodicity.Lifetime,
];

type PeriodicityPriceValue = NonNullable<
  FullMemberPlanFragment['periodicityPricing']
>[number];

const PanelWidth100 = styled(Panel)`
  width: 100%;
`;

const ToggleCol = styled(Col)`
  text-align: end;
`;

const TabContent = styled('div')`
  padding-top: 12px;
`;

function derivePeriodAmount(
  monthlyAmount: number | null | undefined,
  periodicity: PaymentPeriodicity
): number | null {
  if (monthlyAmount == null) {
    return null;
  }

  return Math.round(monthlyAmount * PAYMENT_PERIODICITY_MONTHS[periodicity]);
}

function formatDelta(delta: number, derived: number, currency: string): string {
  const percent = derived > 0 ? ((delta / derived) * 100).toFixed(1) : '0';

  return `${delta >= 0 ? '−' : '+'} ${currency} ${(Math.abs(delta) / 100).toFixed(2)} (${percent}%)`;
}

interface MemberPlanPeriodicityPricingProps {
  memberPlan?: FullMemberPlanFragment | null;
  availablePaymentMethods: ListValue<FullAvailablePaymentMethodFragment>[];
  loading: boolean;
  setMemberPlan: Dispatch<
    SetStateAction<FullMemberPlanFragment | null | undefined>
  >;
}

export function MemberPlanPeriodicityPricing({
  memberPlan,
  availablePaymentMethods,
  loading,
  setMemberPlan,
}: MemberPlanPeriodicityPricingProps) {
  const { t } = useTranslation();
  const currency = memberPlan?.currency ?? 'CHF';
  const [activeTab, setActiveTab] = useState<PaymentPeriodicity | null>(null);

  const enabledPeriodicities = useMemo(() => {
    const enabled = new Set(
      availablePaymentMethods.flatMap(({ value }) => value.paymentPeriodicities)
    );

    return PERIODICITY_ORDER.filter(periodicity => enabled.has(periodicity));
  }, [availablePaymentMethods]);

  const pricing = useMemo(
    () => memberPlan?.periodicityPricing ?? [],
    [memberPlan?.periodicityPricing]
  );

  const periodicity =
    activeTab && enabledPeriodicities.includes(activeTab) ?
      activeTab
    : enabledPeriodicities[0];

  function setPeriodicityPrice(
    price: Omit<PeriodicityPriceValue, 'periodicity'> | null
  ) {
    if (!memberPlan) {
      return;
    }

    const withoutPeriodicity = pricing.filter(
      p => p.periodicity !== periodicity
    );

    setMemberPlan({
      ...memberPlan,
      periodicityPricing:
        price ? [...withoutPeriodicity, { periodicity, ...price }]
        : withoutPeriodicity.length ? withoutPeriodicity
        : null,
    });
  }

  if (!enabledPeriodicities.length) {
    return (
      <PanelWidth100
        header={t('memberplanForm.periodicityPricing')}
        bordered
      >
        <HelpText>
          {t('memberplanForm.periodicityPricingNoPeriodicities')}
        </HelpText>
      </PanelWidth100>
    );
  }

  const override = pricing.find(p => p.periodicity === periodicity);
  const derivedMin = derivePeriodAmount(
    memberPlan?.amountPerMonthMin ?? 0,
    periodicity
  );
  const derivedTarget = derivePeriodAmount(
    memberPlan?.amountPerMonthTarget,
    periodicity
  );
  const derivedMax = derivePeriodAmount(
    memberPlan?.amountPerMonthMax,
    periodicity
  );
  const hasOverride = !!override;

  const referenceDerived = derivedTarget ?? derivedMin;
  const referenceOverride =
    override ? (override.amountTarget ?? override.amountMin) : null;
  const delta =
    referenceDerived != null && referenceOverride != null ?
      referenceDerived - referenceOverride
    : null;

  return (
    <PanelWidth100
      header={t('memberplanForm.periodicityPricing')}
      bordered
    >
      <HelpText>{t('memberplanForm.periodicityPricingHelpText')}</HelpText>

      <Nav
        appearance="tabs"
        activeKey={periodicity}
        onSelect={eventKey => setActiveTab(eventKey as PaymentPeriodicity)}
      >
        {enabledPeriodicities.map(tabPeriodicity => (
          <Nav.Item
            key={tabPeriodicity}
            eventKey={tabPeriodicity}
            icon={
              pricing.some(p => p.periodicity === tabPeriodicity) ?
                <MdPriceCheck />
              : undefined
            }
          >
            {t(`memberPlanList.paymentPeriodicity.${tabPeriodicity}`)}
          </Nav.Item>
        ))}
      </Nav>

      <TabContent>
        <Row>
          <Col xs={18}>
            {delta != null && delta !== 0 && referenceDerived != null && (
              <HelpText>
                {t('memberplanForm.periodicityPricingDelta', {
                  delta: formatDelta(delta, referenceDerived, currency),
                })}
              </HelpText>
            )}
          </Col>

          <ToggleCol xs={6}>
            <Toggle
              checked={hasOverride}
              disabled={loading}
              checkedChildren={t('memberplanForm.periodicityPricingCustom')}
              unCheckedChildren={t('memberplanForm.periodicityPricingDerived')}
              onChange={enabled =>
                setPeriodicityPrice(
                  enabled ?
                    {
                      amountMin: derivedMin ?? 0,
                      amountTarget: derivedTarget,
                      amountMax: derivedMax,
                    }
                  : null
                )
              }
            />
          </ToggleCol>
        </Row>

        <Row>
          <Col xs={8}>
            <Form.ControlLabel>
              {t('memberplanForm.periodicityPricingMin')}
            </Form.ControlLabel>
            <CurrencyInput
              name={`periodicityPricing.${periodicity}.amountMin`}
              currency={currency}
              centAmount={override ? override.amountMin : (derivedMin ?? 0)}
              disabled={loading || !hasOverride}
              onChange={centAmount => {
                if (!override) {
                  return;
                }
                setPeriodicityPrice({
                  ...override,
                  amountMin: Math.round(centAmount || 0),
                });
              }}
            />
          </Col>

          <Col xs={8}>
            <Form.ControlLabel>
              {t('memberplanForm.periodicityPricingTarget')}
            </Form.ControlLabel>
            <CurrencyInput
              name={`periodicityPricing.${periodicity}.amountTarget`}
              currency={currency}
              centAmount={
                override ? (override.amountTarget ?? null) : derivedTarget
              }
              disabled={loading || !hasOverride}
              onChange={centAmount => {
                if (!override) {
                  return;
                }
                setPeriodicityPrice({
                  ...override,
                  amountTarget:
                    centAmount != null ? Math.round(centAmount) : null,
                });
              }}
            />
          </Col>

          <Col xs={8}>
            <Form.ControlLabel>
              {t('memberplanForm.periodicityPricingMax')}
            </Form.ControlLabel>
            <CurrencyInput
              name={`periodicityPricing.${periodicity}.amountMax`}
              currency={currency}
              centAmount={override ? (override.amountMax ?? null) : derivedMax}
              disabled={loading || !hasOverride}
              onChange={centAmount => {
                if (!override) {
                  return;
                }
                setPeriodicityPrice({
                  ...override,
                  amountMax: centAmount != null ? Math.round(centAmount) : null,
                });
              }}
            />
          </Col>
        </Row>
      </TabContent>
    </PanelWidth100>
  );
}
