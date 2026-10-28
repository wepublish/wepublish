import { useMutation, useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateEngagementRuleDocument,
  EngagementRuleDocument,
  EngagementRulesDocument,
} from '@wepublish/editor/api';
import {
  CanCreateEngagementRule,
  CanUpdateEngagementRule,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  enqueueSnackbar,
  humanizeError,
  ListViewContainer,
  ListViewHeader,
  PageTitle,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EngagementPresetCards } from './engagement-preset-cards';
import { findConflicts } from './engagement-conflicts';
import { EngagementRuleForm } from './engagement-rule-form';
import { EngagementRuleReview } from './engagement-rule-review';
import { ENGAGEMENT_PATH } from './engagement-rule-list';
import {
  EngagementRuleValues,
  copyEngagementRule,
  createEngagementRuleSchema,
  engagementRuleToValues,
  toEngagementRuleInput,
} from './engagement-rule-values';
import { ENGAGEMENT_PRESETS } from './presets';

const CreateRuleForm = ({ values }: { values: EngagementRuleValues }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);
  const [review, setReview] = useState<EngagementRuleValues>();
  const { data: rulesData } = useQuery(EngagementRulesDocument);
  const form = useForm<EngagementRuleValues>({
    resolver: zodResolver(createEngagementRuleSchema(t)),
    defaultValues: values,
  });
  const [createRule, { loading }] = useMutation(CreateEngagementRuleDocument, {
    onError: error => {
      setReview(undefined);
      enqueueSnackbar(humanizeError(error), {
        variant: 'error',
        autoHideDuration: 8000,
      });
    },
    onCompleted: data =>
      navigate(
        shouldClose ? ENGAGEMENT_PATH : (
          `${ENGAGEMENT_PATH}/edit/${data.createEngagementRule.id}`
        )
      ),
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(setReview)}>
        <SingleViewTitle
          loading={loading}
          title={t('engagement.create.title')}
          loadingTitle={t('engagement.create.title')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={ENGAGEMENT_PATH}
          setCloseFn={setShouldClose}
        />

        <EngagementRuleForm />
      </form>

      <EngagementRuleReview
        rule={review}
        conflicts={
          review ?
            findConflicts(
              review,
              (rulesData?.engagementRules ?? []).map(other => ({
                ...other,
                stages: engagementRuleToValues(other).stages,
              }))
            )
          : []
        }
        saving={loading}
        onBack={() => setReview(undefined)}
        onConfirm={() =>
          review &&
          createRule({ variables: { input: toEngagementRuleInput(review) } })
        }
      />
    </FormProvider>
  );
};

const CopyRuleForm = ({ id }: { id: string }) => {
  const { t } = useTranslation();
  const { data } = useQuery(EngagementRuleDocument, {
    variables: { id },
    fetchPolicy: 'network-only',
  });

  if (!data) {
    return null;
  }

  return <CreateRuleForm values={copyEngagementRule(data.engagementRule, t)} />;
};

function CreateEngagementRule() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const copyOf = searchParams.get('copyOf');
  const [preset, setPreset] = useState<keyof typeof ENGAGEMENT_PRESETS>();

  if (copyOf) {
    return <CopyRuleForm id={copyOf} />;
  }

  if (preset) {
    return <CreateRuleForm values={ENGAGEMENT_PRESETS[preset]()} />;
  }

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('engagement.create.title')}</PageTitle>
          {/*<p>{t('engagement.create.pickPreset')}</p>*/}
        </ListViewHeader>
      </ListViewContainer>

      <EngagementPresetCards onPick={setPreset} />
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateEngagementRule.id,
  CanUpdateEngagementRule.id,
])(CreateEngagementRule);
export { CheckedPermissionComponent as CreateEngagementRule };
