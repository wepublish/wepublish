import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateGateDocument, GateMode } from '@wepublish/editor/api';
import { toContentGateGateInput } from '@wepublish/gate/editor';
import {
  CanCreateContentGate,
  CanUpdateContentGate,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  enqueueSnackbar,
  humanizeError,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ContentGateForm,
  ContentGateFormData,
  contentGateDefaults,
  createContentGateSchema,
} from './content-gate-form';

const closePath = '/articles/content-gates';

function CreateContentGateForm() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);

  const form = useForm<ContentGateFormData>({
    resolver: zodResolver(createContentGateSchema(t)),
    defaultValues: contentGateDefaults,
  });

  const [createContentGate, { loading }] = useMutation(CreateGateDocument, {
    onError: error =>
      enqueueSnackbar(humanizeError(error), {
        variant: 'error',
        autoHideDuration: 8000,
      }),
    onCompleted: data => {
      navigate(
        shouldClose ? closePath : `${closePath}/edit/${data.createGate.id}`
      );
    },
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(contentGate =>
          createContentGate({
            variables: {
              input: {
                mode: GateMode.ContentGate,
                ...toContentGateGateInput(contentGate),
              },
            },
          })
        )}
      >
        <SingleViewTitle
          loading={loading}
          title={t('contentGate.create.title')}
          loadingTitle={t('contentGate.create.title')}
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
  CanCreateContentGate.id,
  CanUpdateContentGate.id,
])(CreateContentGateForm);
export { CheckedPermissionComponent as CreateContentGateForm };
