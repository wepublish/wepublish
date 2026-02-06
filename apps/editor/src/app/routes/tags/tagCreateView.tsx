import { ApolloError } from '@apollo/client';
import {
  getApiClientV2,
  MutationCreateTagArgs,
  TagType,
  useCreateTagMutation,
} from '@wepublish/editor/api-v2';
import { CanCreateTag } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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

export type TagCreateViewProps = {
  type: TagType;
};

const TagCreateView = ({ type }: TagCreateViewProps) => {
  const { t } = useTranslation();
  const [tag, setTag] = useState<MutationCreateTagArgs>({
    type,
    description: [],
    main: false,
    tag: '',
  });
  const navigate = useNavigate();
  const [shouldClose, setShouldClose] = useState(false);
  const closePath = './..';

  const client = getApiClientV2();
  const [createTag, { loading: createLoading }] = useCreateTagMutation({
    client,
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

  const loading = createLoading;
  const onSubmit = () => createTag({ variables: tag });

  const { StringType, BooleanType } = Schema.Types;
  const validationModel = Schema.Model({
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
        title={t('tags.overview.createTag')}
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
  CanCreateTag.id,
])(TagCreateView);
export { CheckedPermissionComponent as TagCreateView };
