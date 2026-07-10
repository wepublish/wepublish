import styled from '@emotion/styled';
import {
  FullAvailablePaymentMethodFragment,
  FullMemberPlanFragment,
  PaymentPeriodicity,
} from '@wepublish/editor/api';
import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdPriceCheck } from 'react-icons/md';
import { Col, Form, Nav, Panel, Row, Toggle } from 'rsuite';
import {
  CurrencyInput,
  ListValue,
  PAYMENT_PERIODICITY_MONTHS,
} from '@wepublish/ui/editor';

const { HelpText } = Form;

const TAB_PERIODICITY_ORDER = [
  PaymentPeriodicity.Monthly,
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

interface MemberPlanPricingProps {
  memberPlan?: FullMemberPlanFragment | null;
  availablePaymentMethods: ListValue<FullAvailablePaymentMethodFragment>[];
  loading: boolean;
  setMemberPlan: Dispatch<
    SetStateAction<FullMemberPlanFragment | null | undefined>
  >;
}

export function MemberPlanPricing({
  memberPlan,
  availablePaymentMethods,
  loading,
  setMemberPlan,
}: MemberPlanPricingProps) {
  const { t } = useTranslation();
  const currency = memberPlan?.currency ?? 'CHF';
  const [activeTab, setActiveTab] = useState<PaymentPeriodicity | null>(null);

  const enabledPeriodicities = useMemo(() => {
    const enabled = new Set(
      availablePaymentMethods.flatMap(({ value }) => value.paymentPeriodicities)
    );

    return TAB_PERIODICITY_ORDER.filter(periodicity =>
      enabled.has(periodicity)
    );
  }, [availablePaymentMethods]);

  const monthlyEnabled = enabledPeriodicities.includes(
    PaymentPeriodicity.Monthly
  );

  const pricing = useMemo(
    () => memberPlan?.periodicityPricing ?? [],
    [memberPlan?.periodicityPricing]
  );

  useEffect(() => {
    if (monthlyEnabled || !memberPlan || !enabledPeriodicities.length) {
      return;
    }

    const materialized = enabledPeriodicities.map(
      entryPeriodicity =>
        pricing.find(p => p.periodicity === entryPeriodicity) ?? {
          periodicity: entryPeriodicity,
          amountMin:
            derivePeriodAmount(
              memberPlan.amountPerMonthMin,
              entryPeriodicity
            ) ?? 0,
          amountTarget: derivePeriodAmount(
            memberPlan.amountPerMonthTarget,
            entryPeriodicity
          ),
          amountMax: derivePeriodAmount(
            memberPlan.amountPerMonthMax,
            entryPeriodicity
          ),
        }
    );

    const nonLifetime = materialized.filter(
      entry => entry.periodicity !== PaymentPeriodicity.Lifetime
    );
    const referenceCandidates = nonLifetime.length ? nonLifetime : materialized;
    const reference = referenceCandidates.reduce((cheapest, entry) =>
      (
        entry.amountMin / PAYMENT_PERIODICITY_MONTHS[entry.periodicity] <
        cheapest.amountMin / PAYMENT_PERIODICITY_MONTHS[cheapest.periodicity]
      ) ?
        entry
      : cheapest
    );
    const referenceMonths = PAYMENT_PERIODICITY_MONTHS[reference.periodicity];
    const amountPerMonthMin = Math.round(reference.amountMin / referenceMonths);
    const amountPerMonthTarget =
      reference.amountTarget != null ?
        Math.round(reference.amountTarget / referenceMonths)
      : null;
    const amountPerMonthMax =
      reference.amountMax != null ?
        Math.round(reference.amountMax / referenceMonths)
      : null;

    const missingOverride = enabledPeriodicities.some(
      entryPeriodicity => !pricing.some(p => p.periodicity === entryPeriodicity)
    );
    const referenceChanged =
      amountPerMonthMin !== memberPlan.amountPerMonthMin ||
      amountPerMonthTarget !== (memberPlan.amountPerMonthTarget ?? null) ||
      amountPerMonthMax !== (memberPlan.amountPerMonthMax ?? null);

    if (!missingOverride && !referenceChanged) {
      return;
    }

    const untouched = pricing.filter(
      entry => !enabledPeriodicities.includes(entry.periodicity)
    );

    setMemberPlan({
      ...memberPlan,
      amountPerMonthMin,
      amountPerMonthTarget,
      amountPerMonthMax,
      periodicityPricing: [...untouched, ...materialized],
    });
  }, [
    monthlyEnabled,
    enabledPeriodicities,
    pricing,
    memberPlan,
    setMemberPlan,
  ]);

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

  const isMonthlyTab = periodicity === PaymentPeriodicity.Monthly;
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
  const overrideBase = override ?? {
    amountMin: derivedMin ?? 0,
    amountTarget: derivedTarget,
    amountMax: derivedMax,
  };

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
      <HelpText>
        {t(
          monthlyEnabled ?
            'memberplanForm.periodicityPricingHelpText'
          : 'memberplanForm.periodicityPricingHelpTextNoMonthly'
        )}
      </HelpText>

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
              (
                monthlyEnabled &&
                tabPeriodicity !== PaymentPeriodicity.Monthly &&
                pricing.some(p => p.periodicity === tabPeriodicity)
              ) ?
                <MdPriceCheck />
              : undefined
            }
          >
            {t(`memberPlanList.paymentPeriodicity.${tabPeriodicity}`)}
          </Nav.Item>
        ))}
      </Nav>

      <TabContent>
        {isMonthlyTab ?
          <Row>
            <Col xs={8}>
              <Form.ControlLabel>
                {t('memberPlanEdit.amountPerMonthMin')}
              </Form.ControlLabel>
              <CurrencyInput
                name="amountPerMonthMin"
                currency={currency}
                centAmount={memberPlan?.amountPerMonthMin || 0}
                disabled={loading}
                onChange={centAmount => {
                  if (!memberPlan) {
                    return;
                  }
                  setMemberPlan({
                    ...memberPlan,
                    amountPerMonthMin: centAmount || 0,
                  });
                }}
              />
              <HelpText>
                {t('memberplanForm.amountPerMonthMinHelpText')}
              </HelpText>
            </Col>

            <Col xs={8}>
              <Form.ControlLabel>
                {t('memberplanForm.amountPerMonthTarget')}
              </Form.ControlLabel>
              <CurrencyInput
                name="amountPerMonthTarget"
                currency={currency}
                centAmount={memberPlan?.amountPerMonthTarget || 0}
                disabled={loading}
                onChange={centAmount => {
                  if (!memberPlan) {
                    return;
                  }
                  setMemberPlan({
                    ...memberPlan,
                    amountPerMonthTarget: centAmount || null,
                  });
                }}
              />
              <HelpText>
                {t('memberplanForm.amountPerMonthTargetHelpText')}
              </HelpText>
            </Col>

            <Col xs={8}>
              <Form.ControlLabel>
                {t('memberPlanEdit.amountPerMonthMax')}
              </Form.ControlLabel>
              <CurrencyInput
                name="amountPerMonthMax"
                currency={currency}
                centAmount={memberPlan?.amountPerMonthMax ?? null}
                disabled={loading}
                onChange={centAmount => {
                  if (!memberPlan) {
                    return;
                  }
                  setMemberPlan({
                    ...memberPlan,
                    amountPerMonthMax: centAmount ?? null,
                  });
                }}
              />
              <HelpText>
                {t('memberplanForm.amountPerMonthMaxHelpText')}
              </HelpText>
            </Col>
          </Row>
        : <>
            {monthlyEnabled && (
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
                    checkedChildren={t(
                      'memberplanForm.periodicityPricingCustom'
                    )}
                    unCheckedChildren={t(
                      'memberplanForm.periodicityPricingDerived'
                    )}
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
            )}

            <Row>
              <Col xs={8}>
                <Form.ControlLabel>
                  {t('memberplanForm.periodicityPricingMin')}
                </Form.ControlLabel>
                <CurrencyInput
                  name={`periodicityPricing.${periodicity}.amountMin`}
                  currency={currency}
                  centAmount={override ? override.amountMin : (derivedMin ?? 0)}
                  disabled={loading || (monthlyEnabled && !hasOverride)}
                  onChange={centAmount => {
                    setPeriodicityPrice({
                      ...overrideBase,
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
                  disabled={loading || (monthlyEnabled && !hasOverride)}
                  onChange={centAmount => {
                    setPeriodicityPrice({
                      ...overrideBase,
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
                  centAmount={
                    override ? (override.amountMax ?? null) : derivedMax
                  }
                  disabled={loading || (monthlyEnabled && !hasOverride)}
                  onChange={centAmount => {
                    setPeriodicityPrice({
                      ...overrideBase,
                      amountMax:
                        centAmount != null ? Math.round(centAmount) : null,
                    });
                  }}
                />
              </Col>
            </Row>
          </>
        }
      </TabContent>
    </PanelWidth100>
  );
}
