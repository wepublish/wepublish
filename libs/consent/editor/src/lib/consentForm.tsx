import {
  ConsentValue,
  MutationCreateConsentArgs,
  MutationUpdateConsentArgs
} from '@wepublish/editor/api-v2'
import {useTranslation} from 'react-i18next'
import {Form, Panel, SelectPicker} from 'rsuite'

const consentValues = [
  {
    value: ConsentValue.Accepted,
    label: ConsentValue.Accepted
  },
  {
    value: ConsentValue.Rejected,
    label: ConsentValue.Rejected
  },
  {
    value: ConsentValue.Unset,
    label: ConsentValue.Unset
  }
]

type ConsentFormData = MutationCreateConsentArgs['consent'] | MutationUpdateConsentArgs['consent']

type ConsentFormProps = {
  create?: boolean
  consent: ConsentFormData
  onChange: (changes: Partial<ConsentFormData>) => void
}

export const ConsentForm = ({consent, onChange, create}: ConsentFormProps) => {
  const {t} = useTranslation()

  return (
    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
      <Panel bordered style={{overflow: 'initial'}}>
        <Form.Group controlId="name">
          <Form.ControlLabel>{t('consents.name')}</Form.ControlLabel>
          <Form.Control
            name="name"
            value={consent.name ?? ''}
            onChange={(name: string) => onChange({name})}
          />
        </Form.Group>

        <Form.Group controlId="slug">
          <Form.ControlLabel>{t('consents.slug')}</Form.ControlLabel>
          <Form.Control
            name="slug"
            value={consent.slug ?? ''}
            onChange={(slug: string) => onChange({slug})}
          />
        </Form.Group>

        <Form.Group controlId="defaultValue">
          <Form.ControlLabel>{t('consents.defaultValue')}</Form.ControlLabel>
          <SelectPicker
            key="default-value"
            placeholder={t('userSubscriptionEdit.selectMemberPlan')}
            block
            data={consentValues}
            value={consent.defaultValue ?? ''}
            onChange={value =>
              onChange({defaultValue: consentValues.find(v => v.value === value)?.label})
            }
          />
        </Form.Group>
      </Panel>
    </div>
  )
}
