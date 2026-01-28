import {
  MutationCreateConsentArgs,
  MutationUpdateConsentArgs,
} from '@wepublish/editor/api-v2';
import { useTranslation } from 'react-i18next';
import { Checkbox, Form, Panel } from 'rsuite';

const consentValues = [
  {
    value: true,
    label: 'Accepted',
  },
  {
    value: false,
    label: 'Rejected',
  },
];

type ConsentFormData = MutationCreateConsentArgs | MutationUpdateConsentArgs;

type ConsentFormProps = {
  create?: boolean;
  consent: ConsentFormData;
  onChange: (changes: Partial<ConsentFormData>) => void;
};

export const ConsentForm = ({
  consent,
  onChange,
  create,
}: ConsentFormProps) => {
  const { t } = useTranslation();

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}
    >
      <Panel
        bordered
        style={{ overflow: 'initial' }}
      >
        <Form.Group controlId="name">
          <Form.ControlLabel>{t('consents.name')}</Form.ControlLabel>
          <Form.Control
            name="name"
            value={consent.name ?? ''}
            onChange={(name: string) => onChange({ name })}
          />
        </Form.Group>

        <Form.Group controlId="slug">
          <Form.ControlLabel>{t('consents.slug')}</Form.ControlLabel>
          <Form.Control
            name="slug"
            value={consent.slug ?? ''}
            onChange={(slug: string) => onChange({ slug })}
          />
        </Form.Group>

        <Form.Group controlId="defaultValue">
          <Form.ControlLabel>
            {t('consents.defaultValueTitle')}
          </Form.ControlLabel>
          <Checkbox
            checked={!!consent.defaultValue}
            onChange={(_, checked) => {
              onChange({ defaultValue: checked });
            }}
          >
            {consentValues.find(v => v.value === consent.defaultValue)?.label}
          </Checkbox>
        </Form.Group>
      </Panel>
    </div>
  );
};
