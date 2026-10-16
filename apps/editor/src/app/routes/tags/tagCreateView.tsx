import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateTagDocument, TagType } from '@wepublish/editor/api';
import { CanCreateTag } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  enqueueSnackbar,
  humanizeError,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { TagForm } from './tagForm';

const onErrorToast = (error: Error) => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

export type TagCreateViewProps = {
  type: TagType;
};

const TagCreateView = ({ type }: TagCreateViewProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [shouldClose, setShouldClose] = useState(false);
  const closePath = './..';

  const schema = z.object({
    tag: z.string().min(1, t('errorMessages.required')),
    color: z.string().nullish(),
    description: z.any().nullish(),
    main: z.boolean(),
  });

  const { control, handleSubmit } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { tag: '', description: undefined, main: false },
  });

  const [createTag, { loading }] = useMutation(CreateTagDocument, {
    onError: onErrorToast,
    onCompleted: data => {
      if (data.createTag) {
        if (shouldClose) {
          navigate(`./..`);
        } else {
          navigate(`./../edit/${data.createTag.id}`);
        }
      }
    },
  });

  const onSubmit = handleSubmit(values =>
    createTag({ variables: { ...values, type } })
  );

  return (
    <form onSubmit={onSubmit}>
      <SingleViewTitle
        loading={loading}
        title={t('tags.overview.createTag')}
        loadingTitle={t('loading')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      <TagForm
        control={control}
        disabled={loading}
      />
    </form>
  );
};

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateTag.id,
])(TagCreateView);
export { CheckedPermissionComponent as TagCreateView };
