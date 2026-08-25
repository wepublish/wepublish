import {
  QrBillReferenceType,
  useOrganisationSettingsQuery,
  useUpdateOrganisationSettingsMutation,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  ListViewContainer,
  ListViewHeader,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Form,
  Input,
  Message,
  Panel,
  SelectPicker,
  Stack,
  toaster,
} from 'rsuite';
import { DEFAULT_MUTATION_OPTIONS, DEFAULT_QUERY_OPTIONS } from '../common';

const EMPTY = {
  name: '',
  street: '',
  number: '',
  zip: '',
  city: '',
  country: '',
  iban: '',
  referenceType: QrBillReferenceType.Qrr,
};

function OrganisationSettings() {
  const { t } = useTranslation();
  const [values, setValues] = useState(EMPTY);

  const { data } = useOrganisationSettingsQuery(DEFAULT_QUERY_OPTIONS());
  const [updateSettings, { loading }] = useUpdateOrganisationSettingsMutation(
    DEFAULT_MUTATION_OPTIONS(t)
  );

  useEffect(() => {
    const settings = data?.organisationSettings;

    if (!settings) {
      return;
    }

    setValues({
      name: settings.name ?? '',
      street: settings.street ?? '',
      number: settings.number ?? '',
      zip: settings.zip ?? '',
      city: settings.city ?? '',
      country: settings.country ?? '',
      iban: settings.iban ?? '',
      referenceType: settings.referenceType,
    });
  }, [data]);

  const set = (field: keyof typeof EMPTY) => (value: string) =>
    setValues(current => ({ ...current, [field]: value }));

  const save = async () => {
    await updateSettings({ variables: { input: values } });

    toaster.push(
      <Message
        type="success"
        showIcon
      >
        {t('organisationSettings.saved')}
      </Message>
    );
  };

  return (
    <>
      <Stack justifyContent="space-between">
        <ListViewContainer>
          <ListViewHeader>
            <h2>{t('organisationSettings.title')}</h2>
          </ListViewHeader>
        </ListViewContainer>

        <Button
          appearance="primary"
          loading={loading}
          onClick={save}
        >
          {t('organisationSettings.save')}
        </Button>
      </Stack>

      <p style={{ margin: '8px 0 16px', maxWidth: '70ch' }}>
        {t('organisationSettings.hint')}
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 16,
          alignItems: 'start',
        }}
      >
        <Panel
          bordered
          header={t('organisationSettings.sender')}
        >
          <Form fluid>
            <Form.Group>
              <Form.ControlLabel>
                {t('organisationSettings.name')}
              </Form.ControlLabel>
              <Input
                value={values.name}
                onChange={set('name')}
              />
            </Form.Group>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '3fr 1fr',
                gap: 12,
              }}
            >
              <Form.Group>
                <Form.ControlLabel>
                  {t('organisationSettings.street')}
                </Form.ControlLabel>
                <Input
                  value={values.street}
                  onChange={set('street')}
                />
              </Form.Group>

              <Form.Group>
                <Form.ControlLabel>
                  {t('organisationSettings.number')}
                </Form.ControlLabel>
                <Input
                  value={values.number}
                  onChange={set('number')}
                />
              </Form.Group>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 2fr 1fr',
                gap: 12,
              }}
            >
              <Form.Group>
                <Form.ControlLabel>
                  {t('organisationSettings.zip')}
                </Form.ControlLabel>
                <Input
                  value={values.zip}
                  onChange={set('zip')}
                />
              </Form.Group>

              <Form.Group>
                <Form.ControlLabel>
                  {t('organisationSettings.city')}
                </Form.ControlLabel>
                <Input
                  value={values.city}
                  onChange={set('city')}
                />
              </Form.Group>

              <Form.Group>
                <Form.ControlLabel>
                  {t('organisationSettings.country')}
                </Form.ControlLabel>
                <Input
                  value={values.country}
                  onChange={set('country')}
                  placeholder="CH"
                />
              </Form.Group>
            </div>
          </Form>
        </Panel>

        <Panel
          bordered
          header={t('organisationSettings.qrBill')}
        >
          <Form fluid>
            <Form.Group>
              <Form.ControlLabel>
                {t('organisationSettings.iban')}
              </Form.ControlLabel>
              <Input
                value={values.iban}
                onChange={set('iban')}
                placeholder="CH44 3199 9123 0008 8901 2"
              />
              <Form.HelpText>
                {t('organisationSettings.ibanHint')}
              </Form.HelpText>
            </Form.Group>

            <Form.Group>
              <Form.ControlLabel>
                {t('organisationSettings.referenceType')}
              </Form.ControlLabel>
              <SelectPicker
                block
                cleanable={false}
                searchable={false}
                data={Object.values(QrBillReferenceType).map(value => ({
                  label: t(`organisationSettings.referenceTypes.${value}`),
                  value,
                }))}
                value={values.referenceType}
                onChange={value =>
                  value &&
                  setValues(current => ({
                    ...current,
                    referenceType: value as QrBillReferenceType,
                  }))
                }
              />
              <Form.HelpText>
                {t('organisationSettings.referenceTypeHint')}
              </Form.HelpText>
            </Form.Group>
          </Form>
        </Panel>
      </div>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_SETTINGS',
  'CAN_UPDATE_SETTINGS',
])(OrganisationSettings);

export { CheckedPermissionComponent as OrganisationSettings };
