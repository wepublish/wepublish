import styled from '@emotion/styled'
import {
  MemberPlan,
  MutationCreatePaywallArgs,
  MutationUpdatePaywallArgs
} from '@wepublish/editor/api-v2'
import {RichTextBlock, RichTextBlockValue, SelectMemberPlans} from '@wepublish/ui/editor'
import {useTranslation} from 'react-i18next'
import {Checkbox, Form, Panel} from 'rsuite'

type PaywallFormData = (MutationCreatePaywallArgs | MutationUpdatePaywallArgs) & {
  memberPlans?: Pick<MemberPlan, 'id' | 'name'>[]
}

type PaywallFormProps = {
  create?: boolean
  paywall: PaywallFormData
  onChange: (changes: Partial<PaywallFormData>) => void
}

const PaywallFormWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: start;
  gap: 12px;
`

export const PaywallForm = ({paywall, onChange, create}: PaywallFormProps) => {
  const {t} = useTranslation()

  return (
    <PaywallFormWrapper>
      <Panel bordered>
        <Form.Group controlId="name">
          <Form.ControlLabel>{t('paywall.form.name')}</Form.ControlLabel>
          <Form.Control
            name="name"
            value={paywall.name ?? ''}
            onChange={(name: string) => onChange({name})}
          />
        </Form.Group>

        <Form.Group controlId="description">
          <Form.ControlLabel>{t('paywall.form.description')}</Form.ControlLabel>
          <Panel bordered>
            <Form.Control
              name="description"
              value={paywall.description || []}
              onChange={(description: RichTextBlockValue['richText']) => onChange({description})}
              accepter={RichTextBlock}
            />
          </Panel>
        </Form.Group>

        <Form.Group controlId="active">
          <Form.Control
            name="active"
            checked={!!paywall.active}
            onChange={() => onChange({active: !paywall.active})}
            accepter={Checkbox}>
            {t('paywall.form.active')}
          </Form.Control>

          <Form.HelpText>{t('paywall.form.activeHelpText')}</Form.HelpText>
        </Form.Group>
      </Panel>

      <Panel bordered style={{overflow: 'initial'}}>
        <Form.Group controlId="anyMemberPlan">
          <Form.Control
            name="anyMemberPlan"
            checked={!!paywall.anyMemberPlan}
            onChange={() => onChange({anyMemberPlan: !paywall.anyMemberPlan})}
            accepter={Checkbox}>
            {t('paywall.form.anyMemberPlan')}
          </Form.Control>

          <Form.ControlLabel>{t('paywall.form.memberPlans')}</Form.ControlLabel>
          <Form.Control
            name="memberPlans"
            disabled={!!paywall.anyMemberPlan}
            defaultMemberPlans={paywall.memberPlans ?? []}
            selectedMemberPlans={paywall.memberPlanIds ?? []}
            setSelectedMemberPlans={(memberPlanIds: string[]) => onChange({memberPlanIds})}
            accepter={SelectMemberPlans}
          />
        </Form.Group>
      </Panel>
    </PaywallFormWrapper>
  )
}
