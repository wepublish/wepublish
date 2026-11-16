import { useQuery } from '@apollo/client/react';
import {
  Alert,
  Autocomplete,
  Box,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Link,
  Switch,
  TextField,
} from '@mui/material';
import {
  EngagementRulesDocument,
  MemberPlanListDocument,
  NewsletterSignupProblemDocument,
} from '@wepublish/editor/api';

import {
  Controller,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import {
  EngagementRuleValues,
  SHOW_FIRST_PRIORITY,
  engagementRuleToValues,
  showsFirst,
} from './engagement-rule-values';
import { EngagementConflictNotice } from './engagement-conflict-notice';
import { findConflicts } from './engagement-conflicts';

/** Readers would give their email, but it would reach no Mailchimp audience. */
export const NewsletterSignupWarning = () => {
  const { t } = useTranslation();
  const { data } = useQuery(NewsletterSignupProblemDocument, {
    fetchPolicy: 'cache-and-network',
  });
  const problem = data?.newsletterSignupProblem;

  if (!problem) {
    return null;
  }

  return (
    <Alert
      severity="warning"
      data-testid="newsletter-signup-problem"
    >
      {t(`engagement.form.newsletterProblem.${problem}`)}{' '}
      <Link
        component={RouterLink}
        to="/integrations/mailchimp-sync"
      >
        {t('engagement.form.newsletterProblemLink')}
      </Link>
    </Alert>
  );
};

export const MemberPlansField = () => {
  const { t } = useTranslation();
  const { control } = useFormContext<EngagementRuleValues>();
  const { data } = useQuery(MemberPlanListDocument, {
    variables: { take: 100 },
  });
  const plans = data?.memberPlans.nodes ?? [];

  return (
    <Controller
      control={control}
      name="audienceMemberPlanIds"
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          multiple
          disableCloseOnSelect
          options={plans.map(plan => plan.id)}
          getOptionLabel={option =>
            plans.find(plan => plan.id === option)?.name ?? option
          }
          value={field.value ?? []}
          onChange={(_event, ids) => field.onChange(ids ?? [])}
          renderInput={params => (
            <TextField
              {...params}
              label={t('engagement.form.audienceMemberPlans')}
              error={Boolean(error)}
              helperText={error?.message}
            />
          )}
        />
      )}
    />
  );
};

/**
 * Priority stays out of the way until the rule competes with another one for
 * the same spot: then the form says with which, and offers to show it first.
 */
export const ShowFirstField = ({ ruleId }: { ruleId?: string }) => {
  const { t } = useTranslation();
  const { control } = useFormContext<EngagementRuleValues>();
  const rule = useWatch({ control }) as EngagementRuleValues;
  const { data } = useQuery(EngagementRulesDocument);
  const rules = data?.engagementRules ?? [];
  const self = rules.find(({ id }) => id === ruleId);
  const conflicts =
    rule.stages ?
      findConflicts(
        { ...rule, id: ruleId, createdAt: self?.createdAt },
        rules.map(other => ({
          ...other,
          stages: engagementRuleToValues(other).stages,
        }))
      )
    : [];

  const undecided = conflicts.some(({ settled }) => !settled);

  // Nothing to choose without conflicts, or when the other rule is already
  // set to show first.
  if (!undecided && !showsFirst(rule.priority ?? 0)) {
    return <EngagementConflictNotice conflicts={conflicts} />;
  }

  const showFirst = (
    <Controller
      control={control}
      name="priority"
      render={({ field }) => (
        <FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={showsFirst(field.value)}
                onChange={(_event, checked) =>
                  field.onChange(checked ? SHOW_FIRST_PRIORITY : 0)
                }
              />
            }
            label={t('engagement.form.showFirst')}
          />
          <FormHelperText sx={{ mx: 0 }}>
            {t('engagement.form.showFirstInfo')}
          </FormHelperText>
        </FormControl>
      )}
    />
  );

  return conflicts.length ?
      <EngagementConflictNotice conflicts={conflicts}>
        <Box sx={{ mt: 1 }}>{showFirst}</Box>
      </EngagementConflictNotice>
    : showFirst;
};

type FieldErrorLeaf = { path: string[]; message: string };

const flattenErrors = (
  errors: unknown,
  path: string[] = []
): FieldErrorLeaf[] => {
  if (!errors || typeof errors !== 'object') {
    return [];
  }

  const { message } = errors as { message?: unknown };

  if (typeof message === 'string') {
    return [{ path, message }];
  }

  return Object.entries(errors).flatMap(([key, value]) =>
    key === 'ref' ? [] : flattenErrors(value, [...path, key])
  );
};

const PROBLEM_FIELD_LABELS: Record<string, string> = {
  name: 'engagement.form.name',
  meterWindowDays: 'engagement.form.meterWindowDays',
  audienceMemberPlanIds: 'engagement.form.audienceMemberPlans',
};

/**
 * What keeps the rule from being saved, in one place: the fields can be far
 * down the page or in a collapsed stage.
 */
export const RuleProblems = ({ announcement }: { announcement: boolean }) => {
  const { t } = useTranslation();
  const { control } = useFormContext<EngagementRuleValues>();
  const { errors, submitCount } = useFormState({ control });
  const problems = flattenErrors(errors);

  if (!submitCount || !problems.length) {
    return null;
  }

  const where = ([field, index]: string[]) =>
    field === 'stages' && index != null && /^\d+$/.test(index) ?
      announcement ? t('engagement.form.message')
      : t('engagement.form.stage', { number: +index + 1 })
    : PROBLEM_FIELD_LABELS[field] && t(PROBLEM_FIELD_LABELS[field]);

  return (
    <Alert
      severity="error"
      data-testid="rule-problems"
      sx={{ mb: 2 }}
    >
      {t('engagement.form.problems')}
      <Box
        component="ul"
        sx={{ m: 0, pl: 2.5 }}
      >
        {problems.map(({ path, message }) => {
          const location = where(path);

          return (
            <li key={path.join('.')}>
              {location ? `${location}: ${message}` : message}
            </li>
          );
        })}
      </Box>
    </Alert>
  );
};
