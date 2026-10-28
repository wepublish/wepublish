import { useMutation, useQuery } from '@apollo/client/react';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import {
  DeleteEngagementRuleDocument,
  EngagementRulesDocument,
  FullEngagementRuleFragment,
  PaywallListDocument,
  UpdateEngagementRuleDocument,
} from '@wepublish/editor/api';
import {
  CanCreateEngagementRule,
  CanDeleteEngagementRule,
  CanGetEngagementRules,
  CanUpdateEngagementRule,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  DataTable,
  enqueueSnackbar,
  getOperationNameFromDocument,
  humanizeError,
  IconButton,
  IconButtonTooltip,
  Link,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PageTitle,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete } from 'react-icons/md';
import { Link as RouterLink } from 'react-router-dom';
import {
  engagementRuleToValues,
  priorityLevel,
  toEngagementRuleInput,
} from './engagement-rule-values';
import { summarizeRule } from './summarize-rule';

export const ENGAGEMENT_PATH = '/audience-engagement';

const showError = (error: Error) =>
  enqueueSnackbar(humanizeError(error), {
    variant: 'error',
    autoHideDuration: 8000,
  });

function EngagementRuleList() {
  const { t } = useTranslation();
  const [ruleToDelete, setRuleToDelete] =
    useState<FullEngagementRuleFragment>();
  const { data, loading } = useQuery(EngagementRulesDocument);
  const { data: paywallData } = useQuery(PaywallListDocument);
  const [updateRule] = useMutation(UpdateEngagementRuleDocument, {
    onError: showError,
  });
  const [deleteRule] = useMutation(DeleteEngagementRuleDocument, {
    refetchQueries: [getOperationNameFromDocument(EngagementRulesDocument)],
    onError: showError,
    onCompleted: () =>
      enqueueSnackbar(t('toast.deletedSuccess'), {
        variant: 'success',
        autoHideDuration: 3000,
      }),
  });

  const toggle = (rule: FullEngagementRuleFragment, active: boolean) =>
    updateRule({
      variables: {
        input: {
          id: rule.id,
          ...toEngagementRuleInput({ ...engagementRuleToValues(rule), active }),
        },
      },
    });

  const where = (rule: FullEngagementRuleFragment) =>
    [
      rule.showOnArticles && t('engagement.list.articles'),
      rule.showOnPageIds.length > 0 &&
        t('engagement.list.pages', { count: rule.showOnPageIds.length }),
      rule.includePeeredArticles && t('engagement.list.peered'),
    ]
      .filter(Boolean)
      .join(', ');

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t('engagement.list.title')}</PageTitle>
          {/*<p>{t('engagement.list.description')}</p>*/}
        </ListViewHeader>

        <ListViewActions>
          <Button
            component={RouterLink}
            to={`${ENGAGEMENT_PATH}/create`}
            variant="contained"
            startIcon={<MdAdd />}
          >
            {t('engagement.list.create')}
          </Button>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey="engagement-rules"
          data={data?.engagementRules ?? []}
          loading={loading}
          emptyMessage={t('engagement.list.empty')}
          columns={[
            {
              id: 'active',
              label: t('engagement.list.active'),
              width: 90,
              render: rule => (
                <Switch
                  checked={rule.active}
                  slotProps={{
                    input: {
                      'aria-label': t('engagement.list.toggle', {
                        name: rule.name,
                      }),
                    },
                  }}
                  onChange={(_event, active) => toggle(rule, active)}
                />
              ),
            },
            {
              id: 'name',
              label: t('engagement.list.name'),
              render: rule => (
                <Link
                  component={RouterLink}
                  to={`${ENGAGEMENT_PATH}/edit/${rule.id}`}
                >
                  {rule.name}
                </Link>
              ),
            },
            {
              id: 'goal',
              label: t('engagement.list.goal'),
              render: rule => (
                <Chip
                  size="small"
                  label={t(`engagement.goal.${rule.goal}`)}
                />
              ),
            },
            {
              id: 'audience',
              label: t('engagement.list.audience'),
              render: rule => t(`engagement.audience.${rule.audience}`),
            },
            {
              id: 'where',
              label: t('engagement.list.where'),
              render: where,
            },
            {
              id: 'summary',
              label: t('engagement.list.summary'),
              minWidth: 280,
              render: rule =>
                summarizeRule(
                  {
                    goal: rule.goal,
                    stages: engagementRuleToValues(rule).stages,
                  },
                  t
                ),
            },
            {
              id: 'priority',
              label: t('engagement.list.priority'),
              width: 110,
              render: rule =>
                t(`engagement.priority.${priorityLevel(rule.priority)}`),
            },
            {
              id: 'action',
              label: t('action'),
              width: 100,
              align: 'center',
              fixed: true,
              render: rule => (
                <IconButtonTooltip caption={t('delete')}>
                  <IconButton
                    aria-label={t('delete')}
                    color="error"
                    size="small"
                    onClick={() => setRuleToDelete(rule)}
                  >
                    <MdDelete />
                  </IconButton>
                </IconButtonTooltip>
              ),
            },
          ]}
        />
      </TableWrapper>

      <Stack
        spacing={1}
        sx={{ mt: 4 }}
      >
        <Typography variant="h3">{t('engagement.list.paywalls')}</Typography>
        <Typography variant="body2">
          {t('engagement.list.paywallsDescription')}{' '}
          <Link
            component={RouterLink}
            to="/articles/paywalls"
          >
            {t('engagement.list.managePaywalls')}
          </Link>
        </Typography>

        {paywallData?.paywalls.map(paywall => (
          <Stack
            key={paywall.id}
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center' }}
          >
            <Link
              component={RouterLink}
              to={`/articles/paywalls/edit/${paywall.id}`}
            >
              {paywall.name || t('comments.edit.unnamedPaywall')}
            </Link>
            {paywall.enforced && (
              <Chip
                size="small"
                color="primary"
                label={t('engagement.list.enforced')}
              />
            )}
            {!paywall.active && (
              <Chip
                size="small"
                label={t('engagement.list.inactive')}
              />
            )}
            <Typography variant="body2">
              {paywall.anyMemberPlan ?
                t('engagement.list.anyMemberPlan')
              : paywall.memberPlans.map(({ name }) => name).join(', ')}
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Dialog
        open={!!ruleToDelete}
        onClose={() => setRuleToDelete(undefined)}
      >
        <DialogTitle>{t('engagement.delete.title')}</DialogTitle>
        <DialogContent>
          {t('engagement.delete.body', { name: ruleToDelete?.name })}
        </DialogContent>
        <DialogActions>
          <Button
            variant="text"
            onClick={() => setRuleToDelete(undefined)}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              if (ruleToDelete) {
                await deleteRule({ variables: { id: ruleToDelete.id } });
              }

              setRuleToDelete(undefined);
            }}
          >
            {t('engagement.delete.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanGetEngagementRules.id,
  CanCreateEngagementRule.id,
  CanUpdateEngagementRule.id,
  CanDeleteEngagementRule.id,
])(EngagementRuleList);
export { CheckedPermissionComponent as EngagementRuleList };
