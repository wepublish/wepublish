import styled from '@emotion/styled';
import {
  ProductType,
  SubscribeBlockAmountTileLayout,
  SubscribeBlockField,
  SubscribeBlockPlanRenderStyle,
  useMemberPlanListQuery,
} from '@wepublish/editor/api';
import arrayMove from 'array-move';
import { ComponentProps, ReactNode, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MdDragIndicator } from 'react-icons/md';
import {
  SortableContainer,
  SortableElement,
  SortableHandle,
} from 'react-sortable-hoc';
import type { CheckPickerProps } from 'rsuite';
import {
  Checkbox,
  CheckPicker,
  IconButton,
  Panel as RPanel,
  SelectPicker,
  TagInput,
} from 'rsuite';

import { BlockProps } from '../atoms/blockList';
import { SubscribeBlockPlanSettingValue, SubscribeBlockValue } from '.';

const Panel = styled(RPanel)`
  display: grid;
  padding: 0;
  overflow: hidden;
  background-color: #f7f9fa;

  .rs-panel-body {
    display: grid;
    gap: 24px;
  }
`;

const Content = styled.div`
  display: grid;
  gap: 12px;
`;

const Heading = styled('p')`
  margin: 0;
  font-weight: 600;
`;

const MemberPlanCheckPicker = CheckPicker<string>;
const RenderStyleSelectPicker = SelectPicker<SubscribeBlockPlanRenderStyle>;
const TileLayoutSelectPicker = SelectPicker<SubscribeBlockAmountTileLayout>;

const StyledCheckPicker = styled(MemberPlanCheckPicker)`
  width: 100%;
`;

const Hint = styled('p')`
  margin: 0;
  font-size: 12px;
  color: #6c757d;
`;

const PlanStyleRow = styled('div')`
  display: grid;
  grid-template-columns: 1fr auto auto 240px;
  gap: 12px;
  align-items: center;
`;

const PlanDefaultCheckbox = styled(Checkbox)`
  white-space: nowrap;
`;

const PlanStyleName = styled('span')`
  font-size: 14px;
`;

const PlanAmounts = styled('span')`
  width: 150px;
  font-size: 12px;
  color: #6c757d;
  white-space: nowrap;
  text-align: right;
`;

const PlanTileValuesRow = styled('div')`
  display: grid;
  grid-template-columns: 1fr 240px;
  gap: 12px;
  align-items: center;
`;

const StyledTagInput = styled(TagInput)`
  width: 100%;
`;

const PlanRowWrapper = styled('div')<{ sortable: boolean }>`
  display: grid;
  grid-template-columns: ${({ sortable }) => (sortable ? 'auto 1fr' : '1fr')};
  gap: 12px;
  align-items: start;
`;

const PlanRowContent = styled('div')`
  display: grid;
  gap: 12px;
`;

const PlanRowList = styled('div')`
  display: grid;
  gap: 12px;
`;

const PlanDragHandle = SortableHandle<{ disabled?: boolean }>(
  ({ disabled }: { disabled?: boolean }) => (
    <IconButton
      icon={<MdDragIndicator />}
      appearance="subtle"
      disabled={disabled}
    />
  )
);

const SortablePlanRow = SortableElement<{ children: ReactNode }>(
  ({ children }: { children: ReactNode }) => <div>{children}</div>
);

const SortablePlanRowList = SortableContainer<{ children: ReactNode }>(
  ({ children }: { children: ReactNode }) => (
    <PlanRowList>{children}</PlanRowList>
  )
);

export const AMOUNT_TILE_LAYOUTS = [
  SubscribeBlockAmountTileLayout.Narrow,
  SubscribeBlockAmountTileLayout.Wide,
] as const;

export const PLAN_RENDER_STYLES = [
  SubscribeBlockPlanRenderStyle.Card,
  SubscribeBlockPlanRenderStyle.Slider,
  SubscribeBlockPlanRenderStyle.CardAndSlider,
  SubscribeBlockPlanRenderStyle.CardFreeInput,
  SubscribeBlockPlanRenderStyle.AmountTiles,
] as const;

type RenderStyleRuleContext = {
  memberPlanIds: string[];
};

type RenderStyleRule = {
  id: string;
  isStyleAllowed: (
    style: SubscribeBlockPlanRenderStyle,
    context: RenderStyleRuleContext
  ) => boolean;
};

export const RENDER_STYLE_RULES: RenderStyleRule[] = [
  {
    id: 'amountTilesSingle',
    isStyleAllowed: (style, { memberPlanIds }) =>
      style !== SubscribeBlockPlanRenderStyle.AmountTiles ||
      memberPlanIds.length <= 1,
  },
];

const violatedRule = (
  style: SubscribeBlockPlanRenderStyle,
  context: RenderStyleRuleContext
) => RENDER_STYLE_RULES.find(rule => !rule.isStyleAllowed(style, context));

const parseTileValues = (values: readonly string[]) => [
  ...new Set(
    values
      .map(tileValue =>
        Math.round(Number.parseFloat(tileValue.replace(',', '.')) * 100)
      )
      .filter(tileValue => Number.isFinite(tileValue) && tileValue > 0)
  ),
];

const formatTileValues = (amountTileValues: number[] | null | undefined) =>
  (amountTileValues ?? []).map(tileValue => (tileValue / 100).toFixed(2));

const formatPlanAmount = (amount: number | null | undefined) =>
  amount != null ? (amount / 100).toFixed(2) : '–';

export const SubscribeBlock = ({
  value,
  onChange,
  disabled,
}: BlockProps<SubscribeBlockValue>) => {
  const { t } = useTranslation();

  const { data, loading } = useMemberPlanListQuery({
    variables: {
      take: 200,
      filter: {
        active: true,
      },
    },
  });

  const productTypeLabels = useMemo(
    () => ({
      [ProductType.Subscription]: t('memberPlanEdit.productTypeSubscription'),
      [ProductType.Donation]: t('memberPlanEdit.productTypeDonation'),
    }),
    [t]
  );

  const memberPlanOptions = useMemo(
    () =>
      (data?.memberPlans?.nodes ?? []).map(memberPlan => ({
        value: memberPlan.id,
        label: memberPlan.name,
        group: productTypeLabels[memberPlan.productType],
      })),
    [data?.memberPlans?.nodes, productTypeLabels]
  );

  const memberPlanById = useMemo(
    () =>
      new Map(
        (data?.memberPlans?.nodes ?? []).map(memberPlan => [
          memberPlan.id,
          memberPlan,
        ])
      ),
    [data?.memberPlans?.nodes]
  );

  const defaultStyleForPlan = useCallback(
    (memberPlanId: string): SubscribeBlockPlanRenderStyle => {
      const memberPlan = data?.memberPlans?.nodes.find(
        ({ id }) => id === memberPlanId
      );

      return (
          memberPlan &&
            memberPlan.amountPerMonthMin === memberPlan.amountPerMonthMax
        ) ?
          SubscribeBlockPlanRenderStyle.Card
        : SubscribeBlockPlanRenderStyle.Slider;
    },
    [data?.memberPlans?.nodes]
  );

  const handleMemberPlansChange = useCallback<
    NonNullable<CheckPickerProps<string>['onChange']>
  >(
    (memberPlanIds, _event) => {
      onChange(current => {
        const context = { memberPlanIds: memberPlanIds ?? [] };

        return {
          ...current,
          memberPlanIds: memberPlanIds ?? [],
          plans: (memberPlanIds ?? [])
            .map(
              memberPlanId =>
                current.plans.find(
                  plan => plan.memberPlanId === memberPlanId
                ) ?? {
                  memberPlanId,
                  renderStyle: defaultStyleForPlan(memberPlanId),
                }
            )
            .map(plan =>
              violatedRule(plan.renderStyle, context) ?
                { ...plan, renderStyle: defaultStyleForPlan(plan.memberPlanId) }
              : plan
            ),
        };
      });
    },
    [onChange, defaultStyleForPlan]
  );

  const handlePlanStyleChange = useCallback(
    (memberPlanId: string, renderStyle: SubscribeBlockPlanRenderStyle) => {
      onChange(current => {
        const currentPlans =
          current.plans.length ?
            current.plans
          : current.memberPlanIds.map(id => ({
              memberPlanId: id,
              renderStyle: defaultStyleForPlan(id),
            }));

        return {
          ...current,
          plans: currentPlans.map(plan =>
            plan.memberPlanId === memberPlanId ? { ...plan, renderStyle } : plan
          ),
        };
      });
    },
    [onChange, defaultStyleForPlan]
  );

  const handlePlanTileValuesChange = useCallback(
    (memberPlanId: string, amountTileValues: number[]) => {
      onChange(current => {
        const currentPlans =
          current.plans.length ?
            current.plans
          : current.memberPlanIds.map(id => ({
              memberPlanId: id,
              renderStyle: defaultStyleForPlan(id),
            }));

        return {
          ...current,
          plans: currentPlans.map(plan =>
            plan.memberPlanId === memberPlanId ?
              {
                ...plan,
                amountTileValues:
                  amountTileValues.length ? amountTileValues : null,
              }
            : plan
          ),
        };
      });
    },
    [onChange, defaultStyleForPlan]
  );

  const handlePlanSortEnd = useCallback(
    ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
      onChange(current => {
        const currentPlans =
          current.plans.length ?
            current.plans
          : current.memberPlanIds.map(id => ({
              memberPlanId: id,
              renderStyle: defaultStyleForPlan(id),
            }));
        const plans = arrayMove(currentPlans, oldIndex, newIndex);

        return {
          ...current,
          plans,
          memberPlanIds: plans.map(({ memberPlanId }) => memberPlanId),
        };
      });
    },
    [onChange, defaultStyleForPlan]
  );

  const handlePlanDefaultChange = useCallback(
    (memberPlanId: string, isDefault: boolean) => {
      onChange(current => {
        const currentPlans =
          current.plans.length ?
            current.plans
          : current.memberPlanIds.map(id => ({
              memberPlanId: id,
              renderStyle: defaultStyleForPlan(id),
            }));

        return {
          ...current,
          plans: currentPlans.map(plan => ({
            ...plan,
            isDefault: plan.memberPlanId === memberPlanId ? isDefault : false,
          })),
        };
      });
    },
    [onChange, defaultStyleForPlan]
  );

  const handlePlanTileLayoutChange = useCallback(
    (
      memberPlanId: string,
      amountTileLayout: SubscribeBlockAmountTileLayout
    ) => {
      onChange(current => {
        const currentPlans =
          current.plans.length ?
            current.plans
          : current.memberPlanIds.map(id => ({
              memberPlanId: id,
              renderStyle: defaultStyleForPlan(id),
            }));

        return {
          ...current,
          plans: currentPlans.map(plan =>
            plan.memberPlanId === memberPlanId ?
              { ...plan, amountTileLayout }
            : plan
          ),
        };
      });
    },
    [onChange, defaultStyleForPlan]
  );

  const tileLayoutOptions = useMemo<
    { value: SubscribeBlockAmountTileLayout; label: string }[]
  >(
    () =>
      AMOUNT_TILE_LAYOUTS.map(layout => ({
        value: layout,
        label: t(`blocks.subscribe.amountTileLayout.${layout}`),
      })),
    [t]
  );

  const planRows = useMemo<SubscribeBlockPlanSettingValue[]>(
    () =>
      value.plans.length ?
        value.plans
      : value.memberPlanIds.map(memberPlanId => ({
          memberPlanId,
          renderStyle: defaultStyleForPlan(memberPlanId),
        })),
    [value.plans, value.memberPlanIds, defaultStyleForPlan]
  );

  const hasExplicitDefault = planRows.some(({ isDefault }) => isDefault);

  const renderStyleOptions = useMemo<
    { value: SubscribeBlockPlanRenderStyle; label: string }[]
  >(
    () =>
      PLAN_RENDER_STYLES.map(style => ({
        value: style,
        label: t(`blocks.subscribe.renderStyles.${style}`),
      })),
    [t]
  );

  const ruleContext = useMemo(
    () => ({ memberPlanIds: value.memberPlanIds }),
    [value.memberPlanIds]
  );

  const disabledStyles = useMemo(
    () =>
      PLAN_RENDER_STYLES.filter(style =>
        violatedRule(style, ruleContext)
      ) as ComponentProps<typeof RenderStyleSelectPicker>['disabledItemValues'],
    [ruleContext]
  );

  const handleFieldsChange = useCallback<
    NonNullable<CheckPickerProps<string>['onChange']>
  >(
    (fields, _event) => {
      onChange(current => ({
        ...current,
        fields: (fields as SubscribeBlockField[]) ?? [],
      }));
    },
    [onChange]
  );

  const handleShowGoodiesChange = useCallback(
    (_value: unknown, checked: boolean) => {
      onChange(current => ({ ...current, showGoodies: checked }));
    },
    [onChange]
  );

  const handleShowVouchersChange = useCallback(
    (_value: unknown, checked: boolean) => {
      onChange(current => ({ ...current, showVouchers: checked }));
    },
    [onChange]
  );

  return (
    <Panel bordered>
      <Content>
        <Heading>{t('blocks.subscribe.selectMemberPlans')}</Heading>

        <StyledCheckPicker
          cleanable
          block
          disabled={disabled}
          loading={loading}
          searchable
          data={memberPlanOptions}
          value={value.memberPlanIds}
          onChange={handleMemberPlansChange}
          placeholder={t('blocks.subscribe.selectMemberPlansPlaceholder')}
        />

        <Hint>
          {!value.memberPlanIds.length &&
            t('blocks.subscribe.selectMemberPlansSelectionHintAll')}
        </Hint>

        {!!planRows.length && (
          <Heading>{t('blocks.subscribe.renderStylesHeading')}</Heading>
        )}

        <SortablePlanRowList
          onSortEnd={handlePlanSortEnd}
          useDragHandle
        >
          {planRows.map((plan, index) => (
            <SortablePlanRow
              key={plan.memberPlanId}
              index={index}
            >
              <PlanRowWrapper sortable={planRows.length > 1}>
                {planRows.length > 1 && <PlanDragHandle disabled={disabled} />}

                <PlanRowContent>
                  <PlanStyleRow>
                    <PlanStyleName>
                      {memberPlanOptions.find(
                        ({ value: id }) => id === plan.memberPlanId
                      )?.label ?? plan.memberPlanId}
                    </PlanStyleName>

                    <PlanDefaultCheckbox
                      checked={
                        !!plan.isDefault || (!hasExplicitDefault && index === 0)
                      }
                      disabled={disabled}
                      title={t('blocks.subscribe.defaultPlanTitle')}
                      onChange={(_value, checked) =>
                        handlePlanDefaultChange(plan.memberPlanId, checked)
                      }
                    />

                    <PlanAmounts title={t('blocks.subscribe.planAmountsTitle')}>
                      {[
                        memberPlanById.get(plan.memberPlanId)?.currency,
                        [
                          memberPlanById.get(plan.memberPlanId)
                            ?.amountPerMonthMin,
                          memberPlanById.get(plan.memberPlanId)
                            ?.amountPerMonthTarget,
                          memberPlanById.get(plan.memberPlanId)
                            ?.amountPerMonthMax,
                        ]
                          .map(formatPlanAmount)
                          .join(' / '),
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    </PlanAmounts>

                    <RenderStyleSelectPicker
                      cleanable={false}
                      searchable={false}
                      disabled={disabled}
                      data={renderStyleOptions}
                      disabledItemValues={disabledStyles}
                      value={plan.renderStyle}
                      onChange={renderStyle =>
                        renderStyle &&
                        handlePlanStyleChange(plan.memberPlanId, renderStyle)
                      }
                    />
                  </PlanStyleRow>

                  {plan.renderStyle ===
                    SubscribeBlockPlanRenderStyle.AmountTiles && (
                    <>
                      <PlanTileValuesRow>
                        <Hint>
                          {t('blocks.subscribe.amountTileValues.hint')}
                        </Hint>

                        <StyledTagInput
                          disabled={disabled}
                          trigger={['Enter', 'Space']}
                          placeholder={t(
                            'blocks.subscribe.amountTileValues.placeholder'
                          )}
                          value={formatTileValues(plan.amountTileValues)}
                          onChange={tileValues =>
                            handlePlanTileValuesChange(
                              plan.memberPlanId,
                              parseTileValues(tileValues ?? [])
                            )
                          }
                        />
                      </PlanTileValuesRow>

                      <PlanTileValuesRow>
                        <Hint>
                          {t('blocks.subscribe.amountTileLayout.hint')}
                        </Hint>

                        <TileLayoutSelectPicker
                          cleanable={false}
                          searchable={false}
                          disabled={disabled}
                          data={tileLayoutOptions}
                          value={
                            plan.amountTileLayout ??
                            SubscribeBlockAmountTileLayout.Narrow
                          }
                          onChange={amountTileLayout =>
                            amountTileLayout &&
                            handlePlanTileLayoutChange(
                              plan.memberPlanId,
                              amountTileLayout
                            )
                          }
                        />
                      </PlanTileValuesRow>
                    </>
                  )}
                </PlanRowContent>
              </PlanRowWrapper>
            </SortablePlanRow>
          ))}
        </SortablePlanRowList>

        {!!disabledStyles?.length && (
          <Hint>
            {t('blocks.subscribe.renderStyleRules.amountTilesSingle')}
          </Hint>
        )}
      </Content>

      <Content>
        <Heading>{t('blocks.subscribe.selectSections')}</Heading>

        <Checkbox
          checked={value.showGoodies}
          disabled={disabled}
          onChange={handleShowGoodiesChange}
        >
          {t('blocks.subscribe.showGoodies')}
        </Checkbox>

        <Checkbox
          checked={value.showVouchers}
          disabled={disabled}
          onChange={handleShowVouchersChange}
        >
          {t('blocks.subscribe.showVouchers')}
        </Checkbox>
      </Content>

      <Content>
        <Heading>{t('blocks.subscribe.selectFields')}</Heading>

        <StyledCheckPicker
          block
          disabled={disabled}
          data={[
            {
              label: t(`blocks.subscribe.${SubscribeBlockField.FirstName}`),
              value: SubscribeBlockField.FirstName,
            },
            {
              label: t(`blocks.subscribe.${SubscribeBlockField.Birthday}`),
              value: SubscribeBlockField.Birthday,
            },
            {
              label: t(`blocks.subscribe.${SubscribeBlockField.Address}`),
              value: SubscribeBlockField.Address,
            },
            {
              label: t(`blocks.subscribe.${SubscribeBlockField.EmailRepeated}`),
              value: SubscribeBlockField.EmailRepeated,
            },
            {
              label: t(`blocks.subscribe.${SubscribeBlockField.Password}`),
              value: SubscribeBlockField.Password,
            },
            {
              label: t(
                `blocks.subscribe.${SubscribeBlockField.PasswordRepeated}`
              ),
              value: SubscribeBlockField.PasswordRepeated,
            },
          ]}
          value={value.fields}
          onChange={handleFieldsChange}
        />

        <Hint>{t('blocks.subscribe.selectFieldsSelectionHint')}</Hint>
      </Content>
    </Panel>
  );
};
