import { useMutation, useQuery } from '@apollo/client/react';
import {
  MutationUpdateTagArgs,
  TagDocument,
  UpdateTagDocument,
} from '@wepublish/editor/api';
import { CanUpdateTag } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  enqueueSnackbar,
  humanizeError,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Schema } from 'rsuite';

import { TagForm } from './tagForm';

const onErrorToast = (error: Error) => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
};

const TagEditView = () => {
  const { t } = useTranslation();
  const [tag, setTag] = useState<MutationUpdateTagArgs>();
  const [shouldClose, setShouldClose] = useState(false);
  const closePath = './../..';
  const navigate = useNavigate();
  const params = useParams();
  const { id } = params;

  const {
    loading: dataLoading,
    data,
    error,
  } = useQuery(TagDocument, {
    variables: {
      id: id!,
    },
  });

  useEffect(() => {
    if (error) {
      onErrorToast(error);
    }
  }, [error]);

  useEffect(() => {
    if (data?.tag) {
      setTag(data.tag);
    }
  }, [data]);

  const [updateTag, { loading: updateLoading }] = useMutation(
    UpdateTagDocument,
    {
      onError: onErrorToast,
      onCompleted: data => {
        if (data.updateTag) {
          if (shouldClose) {
            navigate(closePath);
          } else {
            setTag(data.updateTag);
          }
        }
      },
    }
  );

  const loading = dataLoading || updateLoading;
  const onSubmit = () => updateTag({ variables: tag! });

  const { StringType, BooleanType } = Schema.Types;
  const validationModel = Schema.Model({
    id: StringType().isRequired(),
    tag: StringType().isRequired(),
    main: BooleanType().isRequired(),
  });

  if (!tag) {
    return;
  }

  return (
    <Form
      formValue={tag || {}}
      model={validationModel}
      disabled={loading}
      onSubmit={validationPassed => validationPassed && onSubmit()}
    >
      <SingleViewTitle
        loading={loading}
        title={t('tags.overview.editTag', { tag: tag.tag })}
        loadingTitle={t('loading')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      <TagForm
        tag={tag}
        onChange={changes =>
          setTag(oldTag => ({ ...oldTag, ...(changes as any) }))
        }
      />
    </Form>
  );
};

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanUpdateTag.id,
])(TagEditView);
export { CheckedPermissionComponent as TagEditView };
