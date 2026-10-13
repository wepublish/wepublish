import { useApolloClient, useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { GateDocument, UpdateGateDocument } from '@wepublish/editor/api';
import {
  contentGateFromGate,
  toContentGateGateInput,
} from '@wepublish/gate/editor';
import { CanUpdateContentGate } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  enqueueSnackbar,
  humanizeError,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ContentGateForm,
  ContentGateFormData,
  createContentGateSchema,
} from './content-gate-form';

const closePath = '/articles/content-gates';

function EditContentGateForm() {
  const { id } = useParams();
  const gateId = id as string;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const client = useApolloClient();
  const [shouldClose, setShouldClose] = useState(false);

  const form = useForm<ContentGateFormData>({
    resolver: zodResolver(createContentGateSchema(t)),
    defaultValues: async () => {
      const { data } = await client.query({
        query: GateDocument,
        variables: { id: gateId },
      });

      return contentGateFromGate(data!.gate);
    },
  });

  const [updateContentGate, { loading }] = useMutation(UpdateGateDocument, {
    onError: error =>
      enqueueSnackbar(humanizeError(error), {
        variant: 'error',
        autoHideDuration: 8000,
      }),
    onCompleted: data => {
      if (shouldClose) {
        navigate(closePath);
      } else {
        form.reset(contentGateFromGate(data.updateGate));
      }
    },
  });

  if (form.formState.isLoading) {
    return null;
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(contentGate =>
          updateContentGate({
            variables: {
              input: { id: gateId, ...toContentGateGateInput(contentGate) },
            },
          })
        )}
      >
        <SingleViewTitle
          loading={loading}
          title={t('contentGate.edit.title')}
          loadingTitle={t('contentGate.edit.title')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={closePath}
          setCloseFn={setShouldClose}
        />

        <ContentGateForm />
      </form>
    </FormProvider>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanUpdateContentGate.id,
])(EditContentGateForm);
export { CheckedPermissionComponent as EditContentGateForm };
