import { ApolloError } from '@apollo/client';
import {
  FullGoodieFragment,
  MutationUpdateGoodieArgs,
  useGoodieQuery,
  useUpdateGoodieMutation,
} from '@wepublish/editor/api';
import { CanUpdateGoodie } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
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

const mapApiDataToInput = (
  goodie: FullGoodieFragment
): MutationUpdateGoodieArgs => ({
  ...goodie,
  memberPlanIDs: goodie.memberPlans.map(memberPlan => memberPlan.id),
});

const GoodieEditView = () => {
  const { t } = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);
  const navigate = useNavigate();
  const params = useParams();
  const { id } = params;
  const closePath = './../..';

  const [goodie, setGoodie] = useState<MutationUpdateGoodieArgs>();

  const { loading: dataLoading } = useGoodieQuery({
    variables: {
      id: id as string,
    },
    onError: onErrorToast,
    onCompleted: data => {
      setGoodie(mapApiDataToInput(data.goodie));
    },
  });

  const [updateGoodie, { loading: updateLoading }] = useUpdateGoodieMutation({
    onError: onErrorToast,
    onCompleted: data => {
      if (data.updateGoodie) {
        if (shouldClose) {
          navigate(closePath);
        } else {
          setGoodie(mapApiDataToInput(data.updateGoodie));
        }
      }
    },
  });

  const loading = dataLoading || updateLoading;
  const onSubmit = () => updateGoodie({ variables: goodie });

  const { StringType, NumberType } = Schema.Types;
  const validationModel = Schema.Model({
    name: StringType().minLength(1).isRequired(),
    stock: NumberType().min(0).isInteger(),
  });

  if (!goodie) {
    return;
  }

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
        title={t('goodie.form.editTitle', { goodie: goodie.name })}
        loadingTitle={t('loading')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      <GoodieForm
        goodie={goodie}
        onChange={changes =>
          setGoodie(oldGoodie => ({ ...oldGoodie, ...(changes as any) }))
        }
      />
    </Form>
  );
};

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanUpdateGoodie.id,
])(GoodieEditView);
export { CheckedPermissionComponent as GoodieEditView };
