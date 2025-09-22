import styled from '@emotion/styled'
import {ProductType, useMemberPlanListQuery} from '@wepublish/editor/api'
import {useCallback, useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {CheckPicker, Panel as RPanel} from 'rsuite'
import type {CheckPickerProps} from 'rsuite'
import {SubscribeBlockValue} from '.'
import {BlockProps} from '../atoms/blockList'

const Panel = styled(RPanel)`
  display: grid;
  padding: 0;
  overflow: hidden;
  background-color: #f7f9fa;
`

const Content = styled.div`
  display: grid;
  gap: 12px;
  padding: 16px 20px;
`

const Heading = styled('p')`
  margin: 0;
  font-weight: 600;
`

const MemberPlanCheckPicker = CheckPicker<string>

const StyledCheckPicker = styled(MemberPlanCheckPicker)`
  width: 100%;
`

const Hint = styled('p')`
  margin: 0;
  font-size: 12px;
  color: #6c757d;
`

export const SubscribeBlock = ({value, onChange, disabled}: BlockProps<SubscribeBlockValue>) => {
  const {t} = useTranslation()
  const {data, loading} = useMemberPlanListQuery({
    variables: {
      take: 200,
      filter: {
        active: true
      }
    }
  })

  const productTypeLabels = useMemo(
    () => ({
      [ProductType.Subscription]: t('memberPlanEdit.productTypeSubscription'),
      [ProductType.Donation]: t('memberPlanEdit.productTypeDonation')
    }),
    [t]
  )

  const memberPlanOptions = useMemo(
    () =>
      (data?.memberPlans?.nodes ?? []).map(memberPlan => ({
        value: memberPlan.id,
        label: memberPlan.name,
        group: productTypeLabels[memberPlan.productType]
      })),
    [data?.memberPlans?.nodes, productTypeLabels]
  )

  const handleChange = useCallback<NonNullable<CheckPickerProps<string>['onChange']>>(
    (memberPlanIds, _event) => {
      onChange(current => ({
        ...current,
        memberPlanIds: memberPlanIds ?? []
      }))
    },
    [onChange]
  )

  return (
    <Panel isEmpty={false} bordered>
      <Content>
        <Heading>{t('blocks.subscribe.selectMemberPlans')}</Heading>

        <StyledCheckPicker
          cleanable
          block
          virtualized
          disabled={disabled}
          loading={loading}
          searchable
          data={memberPlanOptions}
          value={value.memberPlanIds}
          onChange={handleChange}
          placeholder={t('blocks.subscribe.selectMemberPlansPlaceholder')}
        />

        <Hint>
          {value.memberPlanIds.length
            ? t('blocks.subscribe.selectionHintCount', {count: value.memberPlanIds.length})
            : t('blocks.subscribe.selectionHintAll')}
        </Hint>
      </Content>
    </Panel>
  )
}
