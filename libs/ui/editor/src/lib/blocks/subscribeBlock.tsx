import styled from '@emotion/styled';
import {
  ProductType,
  SubscribeBlockField,
  SubscribeBlockPlanRenderStyle,
  useMemberPlanListQuery,
} from '@wepublish/editor/api';
import { ComponentProps, Fragment, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { CheckPickerProps } from 'rsuite';
import { CheckPicker, Panel as RPanel, SelectPicker, TagInput } from 'rsuite';

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
  grid-template-columns: 1fr 240px;
  gap: 12px;
  align-items: center;
`;

const PlanStyleName = styled('span')`
  font-size: 14px;
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
  (amountTileValues ?? []).map(tileValue => String(tileValue / 100));

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

  return (
    <Panel
      isEmpty={false}
      bordered
    >
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

        {!!disabledStyles?.length && (
          <Hint>
            {t('blocks.subscribe.renderStyleRules.amountTilesSingle')}
          </Hint>
        )}

        {!!planRows.length && (
          <Heading>{t('blocks.subscribe.renderStylesHeading')}</Heading>
        )}

        {planRows.map(plan => (
          <Fragment key={plan.memberPlanId}>
            <PlanStyleRow>
              <PlanStyleName>
                {memberPlanOptions.find(
                  ({ value: id }) => id === plan.memberPlanId
                )?.label ?? plan.memberPlanId}
              </PlanStyleName>

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

            {plan.renderStyle === SubscribeBlockPlanRenderStyle.AmountTiles && (
              <PlanTileValuesRow>
                <Hint>{t('blocks.subscribe.amountTileValues.hint')}</Hint>

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
            )}
          </Fragment>
        ))}
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
