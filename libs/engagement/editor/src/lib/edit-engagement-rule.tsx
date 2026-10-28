import { useApolloClient, useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  EngagementRuleDocument,
  UpdateEngagementRuleDocument,
} from '@wepublish/editor/api';
import { CanUpdateEngagementRule } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  enqueueSnackbar,
  humanizeError,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { EngagementRuleForm } from './engagement-rule-form';
import { ENGAGEMENT_PATH } from './engagement-rule-list';
import {
  EngagementRuleValues,
  createEngagementRuleSchema,
  engagementRuleToValues,
  toEngagementRuleInput,
} from './engagement-rule-values';

function EditEngagementRule() {
  const { id } = useParams();
  const ruleId = id as string;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const client = useApolloClient();
  const [shouldClose, setShouldClose] = useState(false);

  const form = useForm<EngagementRuleValues>({
    resolver: zodResolver(createEngagementRuleSchema(t)),
    defaultValues: async () => {
      const { data } = await client.query({
        query: EngagementRuleDocument,
        variables: { id: ruleId },
      });

      return engagementRuleToValues(data!.engagementRule);
    },
  });

  const [updateRule, { loading }] = useMutation(UpdateEngagementRuleDocument, {
    onError: error =>
      enqueueSnackbar(humanizeError(error), {
        variant: 'error',
        autoHideDuration: 8000,
      }),
    onCompleted: data => {
      if (shouldClose) {
        navigate(ENGAGEMENT_PATH);
      } else {
        form.reset(engagementRuleToValues(data.updateEngagementRule));
      }
    },
  });

  if (form.formState.isLoading) {
    return null;
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(rule =>
          updateRule({
            variables: {
              input: { id: ruleId, ...toEngagementRuleInput(rule) },
            },
          })
        )}
      >
        <SingleViewTitle
          loading={loading}
          title={t('engagement.edit.title')}
          loadingTitle={t('engagement.edit.title')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={ENGAGEMENT_PATH}
          setCloseFn={setShouldClose}
        />

        <EngagementRuleForm ruleId={ruleId} />
      </form>
    </FormProvider>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanUpdateEngagementRule.id,
])(EditEngagementRule);
export { CheckedPermissionComponent as EditEngagementRule };
