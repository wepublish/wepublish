import { useMutation, useQuery } from '@apollo/client/react';
import {
  FullGoodieFragment,
  GoodieDocument,
  MutationUpdateGoodieArgs,
  UpdateGoodieDocument,
} from '@wepublish/editor/api';
import { CanUpdateGoodie } from '@wepublish/permissions';
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

import { GoodieForm } from './goodieForm';

const onErrorToast = (error: Error) => {
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });
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

  const {
    loading: dataLoading,
    data,
    error,
  } = useQuery(GoodieDocument, {
    variables: {
      id: id as string,
    },
  });

  useEffect(() => {
    if (error) {
      onErrorToast(error);
    }
  }, [error]);

  useEffect(() => {
    if (data) {
      setGoodie(mapApiDataToInput(data.goodie));
    }
  }, [data]);

  const [updateGoodie, { loading: updateLoading }] = useMutation(
    UpdateGoodieDocument,
    {
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
    }
  );

  const loading = dataLoading || updateLoading;
  const onSubmit = () => updateGoodie({ variables: goodie! });

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
