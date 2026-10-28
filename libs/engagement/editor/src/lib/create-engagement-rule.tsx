import { useMutation, useQuery } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@mui/material';
import {
  CreateEngagementRuleDocument,
  EngagementRuleDocument,
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
import { ENGAGEMENT_PATH } from './engagement-rule-list';
import {
  EngagementRuleValues,
  copyEngagementRule,
  createEngagementRuleSchema,
  toEngagementRuleInput,
} from './engagement-rule-values';
import {
  EngagementRuleView,
  EngagementRuleViews,
} from './engagement-rule-views';
import { ENGAGEMENT_PRESETS } from './presets';

const CreateRuleForm = ({ values }: { values: EngagementRuleValues }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);
  // Saving a new rule shows what it will do first, and creates it from there.
  const [view, setView] = useState<EngagementRuleView>('edit');
  const form = useForm<EngagementRuleValues>({
    resolver: zodResolver(createEngagementRuleSchema(t)),
    defaultValues: values,
  });
  const [createRule, { loading }] = useMutation(CreateEngagementRuleDocument, {
    onError: error =>
      enqueueSnackbar(humanizeError(error), {
        variant: 'error',
        autoHideDuration: 8000,
      }),
    onCompleted: data =>
      navigate(
        shouldClose ? ENGAGEMENT_PATH : (
          `${ENGAGEMENT_PATH}/edit/${data.createEngagementRule.id}`
        )
      ),
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(
          rule =>
            view === 'overview' ?
              createRule({ variables: { input: toEngagementRuleInput(rule) } })
            : setView('overview'),
          () => setView('edit')
        )}
      >
        <SingleViewTitle
          loading={loading}
          title={t('engagement.create.title')}
          loadingTitle={t('engagement.create.title')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={ENGAGEMENT_PATH}
          setCloseFn={setShouldClose}
        />

        <EngagementRuleViews
          view={view}
          onViewChange={setView}
          overviewActions={
            <>
              <Button
                variant="text"
                onClick={() => setView('edit')}
              >
                {t('engagement.review.back')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
              >
                {t('engagement.review.confirm')}
              </Button>
            </>
          }
        />
      </form>
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

/** `?preset=growNewsletter` skips the cards, e.g. from the command palette. */
const presetFrom = (value: string | null) =>
  value && Object.prototype.hasOwnProperty.call(ENGAGEMENT_PRESETS, value) ?
    (value as keyof typeof ENGAGEMENT_PRESETS)
  : undefined;

function CreateEngagementRule() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const copyOf = searchParams.get('copyOf');
  const [preset, setPreset] = useState(() =>
    presetFrom(searchParams.get('preset'))
  );

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
