import { ApolloError } from '@apollo/client';
import {
  MutationCreateGoodieArgs,
  useCreateGoodieMutation,
} from '@wepublish/editor/api';
import { CanCreateGoodie } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Form, Message, Schema, toaster } from 'rsuite';

import { GoodieForm } from './goodieForm';

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

const GoodieCreateView = () => {
  const { t } = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);
  const navigate = useNavigate();
  const closePath = './..';

  const [goodie, setGoodie] = useState<MutationCreateGoodieArgs>({
    name: '',
    active: true,
    memberPlanIDs: [],
  });

  const [createGoodie, { loading: updateLoading }] = useCreateGoodieMutation({
    onError: onErrorToast,
    onCompleted: data => {
      if (data.createGoodie) {
        if (shouldClose) {
          navigate(`./..`);
        } else {
          navigate(`./../edit/${data.createGoodie.id}`);
        }
      }
    },
  });

  const loading = updateLoading;
  const onSubmit = () => createGoodie({ variables: goodie });

  const { StringType, NumberType } = Schema.Types;
  const validationModel = Schema.Model({
    name: StringType().minLength(1).isRequired(),
    stock: NumberType().min(0).isInteger(),
  });

  return (
    <Form
      fluid
      formValue={goodie || {}}
      model={validationModel}
      disabled={loading}
      onSubmit={validationPassed => validationPassed && onSubmit()}
    >
      <SingleViewTitle
        loading={loading}
        title={t('goodie.form.createTitle')}
        loadingTitle={t('loading')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      <GoodieForm
        goodie={goodie ?? {}}
        onChange={changes =>
          setGoodie(oldGoodie => ({ ...oldGoodie, ...(changes as any) }))
        }
      />
    </Form>
  );
};

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateGoodie.id,
])(GoodieCreateView);
export { CheckedPermissionComponent as GoodieCreateView };
