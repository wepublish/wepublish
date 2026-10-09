import styled from '@emotion/styled';
import {
  MutationCreateConsentArgs,
  MutationUpdateConsentArgs,
} from '@wepublish/editor/api';
import { InfoTooltip } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { Form } from 'rsuite';
import {
  Switch,
  FormControlLabel,
  Card as MuiCard,
  CardContent,
} from '@mui/material';

const FormCard = styled(MuiCard)`
  width: 100%;
  max-width: 640px;
  overflow: initial;
`;

const Fields = styled.div`
  display: grid;
  gap: 20px;

  .rs-form-group {
    margin-bottom: 0;
  }
`;

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
    <FormCard>
      <CardContent>
        <CardContent>
          <Fields>
            <Form.Group controlId="name">
              <Form.Label>{t('consents.name')}</Form.Label>
              <Form.Control
                name="name"
                value={consent.name ?? ''}
                onChange={(name: string) => onChange({ name })}
              />
            </Form.Group>

            <Form.Group controlId="slug">
              <Form.Label>
                {t('consents.slug')}{' '}
                <InfoTooltip text={t('consents.slugInfo')} />
              </Form.Label>
              <Form.Control
                name="slug"
                value={consent.slug ?? ''}
                onChange={(slug: string) => onChange({ slug })}
              />
            </Form.Group>

            <FormControlLabel
              control={
                <Switch
                  checked={!!consent.defaultValue}
                  onChange={(_event, defaultValue) =>
                    onChange({ defaultValue })
                  }
                />
              }
              label={
                <>
                  {t('consents.checkedByDefault')}{' '}
                  <InfoTooltip text={t('consents.defaultValueInfo')} />
                </>
              }
            />
          </Fields>
        </CardContent>
      </CardContent>
    </FormCard>
  );
};
