import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@mui/material';
import {
  DeleteOrganizationDocument,
  EditorOrganizationDocument,
  UpdateOrganizationDocument,
} from '@wepublish/editor/api';
import {
  enqueueSnackbar,
  humanizeError,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useRef, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { ConfirmDialog } from '../confirm-dialog';
import { showError } from '../show-error';
import { OrganizationForm } from './organization-form';
import {
  emptyOrganizationForm,
  organizationFormFromOrganization,
  OrganizationFormValues,
  organizationFormSchema,
  organizationVariables,
} from './organization-form-schema';
import { OrganizationMembers } from './organization-members';
import { ORGANIZATIONS_PATH } from './organization-paths';
import { OrganizationVenues } from './organization-venues';

export function EditOrganization() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const client = useApolloClient();
  const closeAfterSave = useRef(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: async () => {
      try {
        const { data } = await client.query({
          query: EditorOrganizationDocument,
          variables: { id },
        });

        return data?.organization ?
            organizationFormFromOrganization(data.organization)
          : emptyOrganizationForm();
      } catch (error) {
        showError(error);

        return emptyOrganizationForm();
      }
    },
  });
  const name = useWatch({ control: form.control, name: 'name' });

  const { data } = useQuery(EditorOrganizationDocument, { variables: { id } });
  const organization = data?.organization ?? undefined;

  const [updateOrganization, { loading }] = useMutation(
    UpdateOrganizationDocument
  );
  const [deleteOrganization, { loading: deleting }] = useMutation(
    DeleteOrganizationDocument
  );

  const save = async (values: OrganizationFormValues) => {
    const close = closeAfterSave.current;
    closeAfterSave.current = false;

    try {
      const { data: saved } = await updateOrganization({
        variables: { id, ...organizationVariables(values) },
      });

      if (saved?.updateOrganization) {
        form.reset(organizationFormFromOrganization(saved.updateOrganization));
      }

      enqueueSnackbar(t('agenda.organizations.form.saved'), {
        variant: 'success',
      });

      if (close) {
        navigate(ORGANIZATIONS_PATH);
      }
    } catch (error) {
      showError(error);
    }
  };

  const remove = async () => {
    try {
      await deleteOrganization({ variables: { id } });
      navigate(ORGANIZATIONS_PATH);
    } catch (error) {
      setDeleteError(humanizeError(error as Error));
    }
  };

  if (form.formState.isLoading) {
    return null;
  }

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
          disabled={organization?.viewerCan.update === false}
          title={t('agenda.organizations.form.editTitle', { name })}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={ORGANIZATIONS_PATH}
          setCloseFn={close => {
            closeAfterSave.current = close;
          }}
        >
          {organization?.viewerCan.delete && (
            <Button
              variant="text"
              color="error"
              onClick={() => {
                setDeleteError(undefined);
                setConfirmDelete(true);
              }}
            >
              {t('agenda.organizations.form.delete')}
            </Button>
          )}
        </SingleViewTitle>

        <OrganizationForm
          isNew={false}
          sensitive={organization?.__typename === 'SensitiveDataOrganization'}
          defaultTags={organization?.tags ?? []}
          viewerCan={organization?.viewerCan}
          aside={
            <>
              <OrganizationMembers organizationId={id} />
              <OrganizationVenues organizationId={id} />
            </>
          }
        />
      </form>

      <ConfirmDialog
        open={confirmDelete}
        title={t('agenda.organizations.list.deleteTitle')}
        body={t('agenda.organizations.list.deleteBody', { name })}
        confirmLabel={t('agenda.organizations.list.confirmDelete')}
        busy={deleting}
        error={deleteError}
        onConfirm={remove}
        onClose={() => setConfirmDelete(false)}
      />
    </FormProvider>
  );
}
