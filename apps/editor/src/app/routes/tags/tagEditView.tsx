import { ApolloError } from '@apollo/client';
import {
  getApiClientV2,
  MutationUpdateTagArgs,
  useTagQuery,
  useUpdateTagMutation,
} from '@wepublish/editor/api-v2';
import { CanUpdateTag } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Message, Schema, toaster } from 'rsuite';

import { TagForm } from './tagForm';

const onErrorToast = (error: ApolloError) => {
  toaster.push(
    <Message
      type="error"
      showIcon
      closable
      duration={3000}
    >
      {error.message}
    </Message>
  );
};

const TagEditView = () => {
  const { t } = useTranslation();
  const [tag, setTag] = useState<MutationUpdateTagArgs>();
  const [shouldClose, setShouldClose] = useState(false);
  const closePath = './../..';
  const navigate = useNavigate();
  const params = useParams();
  const { id } = params;

  const client = getApiClientV2();
  const { loading: dataLoading } = useTagQuery({
    client,
    variables: {
      id: id!,
    },
    onError: onErrorToast,
    onCompleted: data => {
      if (data.tag) {
        setTag(data.tag);
      }
    },
  });

  const [updateTag, { loading: updateLoading }] = useUpdateTagMutation({
    client,
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
  });

  const loading = dataLoading || updateLoading;
  const onSubmit = () => updateTag({ variables: tag });

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
      fluid
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
