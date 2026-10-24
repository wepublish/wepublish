import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateOrganizationDocument } from '@wepublish/editor/api';
import { enqueueSnackbar, SingleViewTitle } from '@wepublish/ui/editor';
import { useRef } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { showError } from '../show-error';
import { OrganizationForm } from './organization-form';
import {
  emptyOrganizationForm,
  OrganizationFormValues,
  organizationFormSchema,
  organizationVariables,
} from './organization-form-schema';
import { organizationEditPath, ORGANIZATIONS_PATH } from './organization-paths';

export function CreateOrganization() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const closeAfterSave = useRef(false);

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: emptyOrganizationForm(),
  });

  const [createOrganization, { loading }] = useMutation(
    CreateOrganizationDocument
  );

  const save = async (values: OrganizationFormValues) => {
    const close = closeAfterSave.current;
    closeAfterSave.current = false;

    try {
      const { data } = await createOrganization({
        variables: organizationVariables(values),
      });

      if (!data?.createOrganization) {
        return;
      }

      enqueueSnackbar(t('agenda.organizations.form.created'), {
        variant: 'success',
      });
      form.reset(values);
      navigate(
        close ? ORGANIZATIONS_PATH : (
          organizationEditPath(data.createOrganization.id)
        ),
        { replace: !close }
      );
    } catch (error) {
      showError(error);
    }
  };

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={event =>
          form.handleSubmit(save, () => {
            closeAfterSave.current = false;
          })(event)
        }
      >
        <SingleViewTitle
          loading={loading}
          title={t('agenda.organizations.form.createTitle')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={ORGANIZATIONS_PATH}
          setCloseFn={close => {
            closeAfterSave.current = close;
          }}
        />

        <OrganizationForm
          isNew
          sensitive
          defaultTags={[]}
        />
      </form>
    </FormProvider>
  );
}
