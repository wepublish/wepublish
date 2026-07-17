import styled from '@emotion/styled';
import {
  ProductType,
  SubscribeBlockField,
  SubscribeBlockPlanRenderStyle,
  useMemberPlanListQuery,
} from '@wepublish/editor/api';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { CheckPickerProps } from 'rsuite';
import { CheckPicker, Panel as RPanel, SelectPicker } from 'rsuite';

import { BlockProps } from '../atoms/blockList';
import { SubscribeBlockValue } from '.';

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

export const PLAN_RENDER_STYLES = [
  SubscribeBlockPlanRenderStyle.Card,
  SubscribeBlockPlanRenderStyle.Slider,
  SubscribeBlockPlanRenderStyle.CardAndSlider,
  SubscribeBlockPlanRenderStyle.CardFreeInput,
  SubscribeBlockPlanRenderStyle.AmountTiles,
] as const;

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
    (memberPlanId: string) => {
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
      onChange(current => ({
        ...current,
        memberPlanIds: memberPlanIds ?? [],
        plans: (memberPlanIds ?? []).map(
          memberPlanId =>
            current.plans.find(plan => plan.memberPlanId === memberPlanId) ?? {
              memberPlanId,
              renderStyle: defaultStyleForPlan(memberPlanId),
            }
        ),
      }));
    },
    [onChange, defaultStyleForPlan]
  );

  const handlePlanStyleChange = useCallback(
    (memberPlanId: string, renderStyle: SubscribeBlockPlanRenderStyle) => {
      onChange(current => ({
        ...current,
        plans: current.plans.map(plan =>
          plan.memberPlanId === memberPlanId ? { ...plan, renderStyle } : plan
        ),
      }));
    },
    [onChange]
  );

  const renderStyleOptions = useMemo(
    () =>
      PLAN_RENDER_STYLES.map(style => ({
        value: style,
        label: t(`blocks.subscribe.renderStyles.${style}`),
      })),
    [t]
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

        {value.plans.map(plan => (
          <PlanStyleRow key={plan.memberPlanId}>
            <PlanStyleName>
              {memberPlanOptions.find(
                ({ value: id }) => id === plan.memberPlanId
              )?.label ?? plan.memberPlanId}
            </PlanStyleName>

            <SelectPicker
              cleanable={false}
              searchable={false}
              disabled={disabled}
              data={renderStyleOptions}
              value={plan.renderStyle}
              onChange={renderStyle =>
                renderStyle &&
                handlePlanStyleChange(plan.memberPlanId, renderStyle)
              }
            />
          </PlanStyleRow>
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
