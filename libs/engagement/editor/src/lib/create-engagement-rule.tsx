import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Typography,
} from '@mui/material';
import { CreateEngagementRuleDocument } from '@wepublish/editor/api';
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
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { EngagementRuleForm } from './engagement-rule-form';
import { ENGAGEMENT_PATH } from './engagement-rule-list';
import {
  EngagementRuleValues,
  createEngagementRuleSchema,
  toEngagementRuleInput,
} from './engagement-rule-values';
import {
  ENGAGEMENT_PRESETS,
  EngagementPresetId,
  RESTRICT_PREMIUM_PATH,
} from './presets';

const PRESET_ORDER: EngagementPresetId[] = [
  'growNewsletter',
  'promoteMemberships',
  'restrictPremium',
  'displayAnnouncement',
];

export const EngagementPresetCards = ({
  onPick,
}: {
  onPick: (preset: keyof typeof ENGAGEMENT_PRESETS) => void;
}) => {
  const { t } = useTranslation();

  return (
    <Grid
      container
      spacing={2}
    >
      {PRESET_ORDER.map(preset => (
        <Grid
          key={preset}
          size={{ xs: 12, md: 6 }}
        >
          <Card variant="outlined">
            <CardActionArea
              {...(preset === 'restrictPremium' ?
                { component: RouterLink, to: RESTRICT_PREMIUM_PATH }
              : { onClick: () => onPick(preset) })}
            >
              <CardContent>
                <Typography variant="h4">
                  {t(`engagement.preset.${preset}`)}
                </Typography>
                <Typography variant="body2">
                  {t(`engagement.preset.${preset}Info`)}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

const CreateRuleForm = ({ values }: { values: EngagementRuleValues }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);
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
        onSubmit={form.handleSubmit(rule =>
          createRule({ variables: { input: toEngagementRuleInput(rule) } })
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

        <EngagementRuleForm />
      </form>
    </FormProvider>
  );
};

function CreateEngagementRule() {
  const { t } = useTranslation();
  const [preset, setPreset] = useState<keyof typeof ENGAGEMENT_PRESETS>();

  if (preset) {
    return <CreateRuleForm values={ENGAGEMENT_PRESETS[preset]()} />;
  }

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('engagement.create.title')}</PageTitle>
          <p>{t('engagement.create.pickPreset')}</p>
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
