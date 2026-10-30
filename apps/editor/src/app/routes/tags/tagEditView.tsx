import { useApolloClient, useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { TagDocument, UpdateTagDocument } from '@wepublish/editor/api';
import { CanUpdateTag } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  enqueueSnackbar,
  humanizeError,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { TagForm } from './tagForm';

const onErrorToast = (error: Error) => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

const TagEditView = () => {
  const { t } = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);
  const closePath = './../..';
  const navigate = useNavigate();
  const { id } = useParams();

  const client = useApolloClient();

  const schema = z.object({
    id: z.string().min(1),
    tag: z.string().min(1, t('errorMessages.required')),
    color: z.string().nullish(),
    description: z.any().nullish(),
    main: z.boolean(),
  });

  const { control, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: async () => {
      const { data } = await client.query({
        query: TagDocument,
        variables: { id: id! },
      });

      return data!.tag as z.infer<typeof schema>;
    },
  });

  const tag = useWatch({ control, name: 'tag' });

  const [updateTag, { loading: updateLoading }] = useMutation(
    UpdateTagDocument,
    {
      onError: onErrorToast,
      onCompleted: data => {
        if (data.updateTag) {
          if (shouldClose) {
            navigate(closePath);
          }
        }
      },
    }
  );

  const onSubmit = handleSubmit(values => updateTag({ variables: values }));

  if (formState.isLoading) {
    return null;
  }

  return (
    <form onSubmit={onSubmit}>
      <SingleViewTitle
        loading={updateLoading}
        title={t('tags.overview.editTag', { tag })}
        loadingTitle={t('loading')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      <TagForm
        control={control}
        disabled={updateLoading}
      />
    </form>
  );
};

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanUpdateTag.id,
])(TagEditView);
export { CheckedPermissionComponent as TagEditView };
