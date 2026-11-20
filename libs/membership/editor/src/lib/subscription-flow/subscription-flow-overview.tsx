import { useMutation, useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import {
  CreateSubscriptionFlowDocument,
  DeleteSubscriptionFlowDocument,
  ListPaymentMethodsDocument,
  MemberPlanListDocument,
  SubscriptionFlowsDocument,
} from '@wepublish/editor/api';
import {
  CanCreateSubscriptionFlow,
  CanDeleteSubscriptionFlow,
  CanGetSubscriptionFlows,
  CanUpdateSubscriptionFlow,
} from '@wepublish/permissions';
import {
  DataTable,
  DataTableColumn,
  DRAWER_WIDTHS,
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
  IconButton,
  IconButtonTooltip,
  Link,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  MultiSelectFilter,
  PageTitle,
  PermissionControl,
  useAuthorisation,
} from '@wepublish/ui/editor';
import { useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdDelete, MdEdit, MdWarningAmber } from 'react-icons/md';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DEFAULT_MUTATION_OPTIONS } from '../common';
import { usePaperLetterFlow } from '../delivery-mode/use-paper-letter-flow';
import { SystemMailSection } from '../system-mail/system-mail-section';
import { FlowFilters } from './filter/flow-filters';
import {
  filterFlowRows,
  flowPath,
  FlowRow,
  flowRows,
  MEMBER_PLAN_PARAM,
  newFlowId,
} from './flow-overview';
import { SubscriptionClientContext } from './graphql-client-context';

const Intro = styled(Typography)`
  max-width: 880px;
  margin-top: ${({ theme }) => theme.spacing(1)};
`;

const Section = styled.section`
  margin-top: ${({ theme }) => theme.spacing(3)};
`;

const Warning = styled.span`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(0.5)};
  margin-top: ${({ theme }) => theme.spacing(0.5)};
  font-size: 13px;
  white-space: normal;
  color: ${({ theme }) => theme.vars.palette.warning.dark};

  > svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const PlanFilter = styled.div`
  max-width: 360px;
`;

const PanelFields = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

type CreateFlowPanelProps = {
  /** The plan the overview is narrowed to, if it is exactly one. */
  memberPlanId?: string;
  knownFlowIds: string[];
  onClose(): void;
};

// Chosen in place of a member plan: the flow is for all of them.
const ALL_MEMBER_PLANS = '__all';

/**
 * A new flow: for which member plan, or for all of them, and which of their
 * subscriptions. The page of the new flow opens once it exists; its messages
 * are set there.
 */
function CreateFlowPanel({
  memberPlanId: initialMemberPlanId,
  knownFlowIds,
  onClose,
}: CreateFlowPanelProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const client = useContext(SubscriptionClientContext);
  const [memberPlanId, setMemberPlanId] = useState(initialMemberPlanId ?? '');

  const { data: memberPlans } = useQuery(MemberPlanListDocument, {
    variables: { take: 100 },
  });
  const { data: paymentMethods } = useQuery(ListPaymentMethodsDocument);

  const [createSubscriptionFlow] = useMutation(
    CreateSubscriptionFlowDocument,
    DEFAULT_MUTATION_OPTIONS(t)
  );

  // The conditions form creates through the context; here that also leads
  // on to the flow it created.
  const createAndOpen: typeof createSubscriptionFlow = async options => {
    const result = await createSubscriptionFlow(options);
    const id = newFlowId(knownFlowIds, result.data?.createSubscriptionFlow);

    if (id) {
      navigate(flowPath({ id, default: false }));
    }

    return result;
  };

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{t('subscriptionFlow.newFlow')}</DrawerTitle>

        <DrawerActions>
          <Button
            variant="text"
            onClick={() => onClose()}
          >
            {t('close')}
          </Button>
        </DrawerActions>
      </DrawerHeader>

      <DrawerBody>
        <PanelFields>
          <Typography
            variant="body2"
            color="textSecondary"
          >
            {t('subscriptionFlow.overview.createIntro')}
          </Typography>

          <TextField
            select
            label={t('subscriptionFlow.overview.memberPlan')}
            value={memberPlanId}
            onChange={event => setMemberPlanId(event.target.value)}
            fullWidth
          >
            <MenuItem value={ALL_MEMBER_PLANS}>
              {t('subscriptionFlow.overview.allMemberPlans')}
            </MenuItem>

            {(memberPlans?.memberPlans.nodes ?? []).map(memberPlan => (
              <MenuItem
                key={memberPlan.id}
                value={memberPlan.id}
              >
                {memberPlan.name}
              </MenuItem>
            ))}
          </TextField>

          {memberPlanId && (
            <SubscriptionClientContext.Provider
              value={{ ...client, createSubscriptionFlow: createAndOpen }}
            >
              <div>
                <Typography variant="subtitle2">
                  {t('subscriptionFlow.filters')}
                </Typography>

                <Typography
                  variant="body2"
                  color="textSecondary"
                >
                  {t('subscriptionFlow.filtersDescription')}
                </Typography>
              </div>

              {/* Keyed by plan: what was picked belongs to the plan it was
                  picked for. */}
              <FlowFilters
                key={memberPlanId}
                memberPlan={
                  memberPlanId === ALL_MEMBER_PLANS ? undefined : (
                    { id: memberPlanId }
                  )
                }
                createNewFlow
                paymentMethods={paymentMethods}
              />
            </SubscriptionClientContext.Provider>
          )}
        </PanelFields>
      </DrawerBody>
    </>
  );
}

/** Every communication flow there is, the default one first. */
function FlowTable() {
  const { t } = useTranslation();
  const paperLetterFlow = usePaperLetterFlow();
  const navigate = useNavigate();
  const canDelete = useAuthorisation(CanDeleteSubscriptionFlow.id);

  const [searchParams, setSearchParams] = useSearchParams();
  const memberPlanIds = searchParams.getAll(MEMBER_PLAN_PARAM);

  const { data, loading, refetch } = useQuery(SubscriptionFlowsDocument, {
    variables: { defaultFlowOnly: false },
  });

  const [deleteSubscriptionFlow, { loading: deleting }] = useMutation(
    DeleteSubscriptionFlowDocument,
    DEFAULT_MUTATION_OPTIONS(t)
  );

  const [flowToDelete, setFlowToDelete] = useState<FlowRow>();
  const [creating, setCreating] = useState(false);

  const allRows = useMemo(
    () => flowRows(data?.subscriptionFlows ?? [], t),
    [data, t]
  );
  const rows = filterFlowRows(allRows, memberPlanIds);

  const memberPlanOptions = useMemo(
    () =>
      [
        ...new Map(
          allRows.flatMap(row =>
            row.memberPlanId ?
              [[row.memberPlanId, row.memberPlanName ?? '']]
            : []
          ) as [string, string][]
        ),
      ].map(([value, label]) => ({ value, label })),
    [allRows]
  );

  const setMemberPlanIds = (ids: string[]) =>
    setSearchParams(
      params => {
        const next = new URLSearchParams(params);
        next.delete(MEMBER_PLAN_PARAM);
        ids.forEach(id => next.append(MEMBER_PLAN_PARAM, id));

        return next;
      },
      { replace: true }
    );

  const confirmDelete = async () => {
    if (!flowToDelete) {
      return;
    }

    try {
      await deleteSubscriptionFlow({ variables: { id: flowToDelete.id } });
      await refetch();
    } finally {
      setFlowToDelete(undefined);
    }
  };

  const columns: DataTableColumn<FlowRow>[] = [
    {
      id: 'memberPlan',
      label: t('subscriptionFlow.overview.flow'),
      width: 240,
      render: row => (
        <Link to={flowPath(row.flow)}>
          {row.isDefault ?
            t('subscriptionFlow.overview.defaultFlow')
          : (row.memberPlanName ?? t('subscriptionFlow.overview.noMemberPlan'))}
        </Link>
      ),
    },
    {
      id: 'conditions',
      label: t('subscriptionFlow.overview.appliesTo'),
      width: 380,
      render: row => (
        <>
          {row.isDefault ?
            t('subscriptionFlow.overview.defaultApplies')
          : row.conditions}

          {row.warnings.map(warning => (
            <Warning key={warning}>
              <MdWarningAmber aria-hidden />
              {warning}
            </Warning>
          ))}
        </>
      ),
    },
    {
      id: 'subscriptions',
      label: t('subscriptionFlow.overview.subscriptions'),
      width: 170,
      align: 'right',
      render: row => row.subscriptions,
    },
    {
      id: 'events',
      label: t('subscriptionFlow.overview.events'),
      width: 190,
      render: row =>
        t('subscriptionFlow.overview.eventsValue', {
          sending: row.eventsWithTemplate,
          total: row.eventsTotal,
        }),
    },
    ...(paperLetterFlow ?
      [
        {
          id: 'letterEvents',
          label: t('subscriptionFlow.overview.letterEvents'),
          width: 150,
          align: 'right',
          render: row => row.letterEvents,
        } satisfies DataTableColumn<FlowRow>,
      ]
    : []),
    {
      id: 'action',
      label: t('action'),
      width: 100,
      fixed: true,
      render: row => (
        // From the left edge, so that «edit» sits in the same place in every
        // row, whether or not «delete» follows it.
        <Box
          data-actions
          sx={{ display: 'flex', justifyContent: 'flex-start', gap: 1 }}
        >
          <IconButtonTooltip caption={t('edit')}>
            <IconButton
              size="small"
              aria-label={t('edit')}
              onClick={() => navigate(flowPath(row.flow))}
            >
              <MdEdit />
            </IconButton>
          </IconButtonTooltip>

          {/* The default flow is what every subscription falls back to. */}
          {!row.isDefault && canDelete && (
            <IconButtonTooltip caption={t('delete')}>
              <IconButton
                size="small"
                color="error"
                aria-label={t('delete')}
                onClick={() => setFlowToDelete(row)}
              >
                <MdDelete />
              </IconButton>
            </IconButtonTooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Section aria-labelledby="flows-title">
      <ListViewContainer>
        <ListViewHeader>
          <Typography
            id="flows-title"
            variant="h5"
            component="h2"
          >
            {t('subscriptionFlow.overview.title')}
          </Typography>
        </ListViewHeader>

        <ListViewActions>
          <PermissionControl
            showRejectionMessage={false}
            qualifyingPermissions={[CanCreateSubscriptionFlow.id]}
          >
            <Button
              variant="contained"
              startIcon={<MdAdd />}
              onClick={() => setCreating(true)}
            >
              {t('subscriptionFlow.newFlow')}
            </Button>
          </PermissionControl>
        </ListViewActions>
      </ListViewContainer>

      <DataTable
        data={rows}
        loading={loading && !data}
        getRowId={row => row.id}
        columns={columns}
        filters={
          <PlanFilter>
            <MultiSelectFilter
              label={t('subscriptionFlow.overview.memberPlan')}
              options={memberPlanOptions}
              value={memberPlanIds}
              onChange={setMemberPlanIds}
            />
          </PlanFilter>
        }
        filterCount={memberPlanIds.length ? 1 : 0}
        onResetFilters={() => setMemberPlanIds([])}
      />

      <Drawer
        anchor="right"
        slotProps={{
          paper: { sx: { width: DRAWER_WIDTHS.sm, maxWidth: '100vw' } },
        }}
        open={creating}
        onClose={() => setCreating(false)}
      >
        <CreateFlowPanel
          memberPlanId={
            memberPlanIds.length === 1 ? memberPlanIds[0] : undefined
          }
          knownFlowIds={allRows.map(row => row.id)}
          onClose={() => setCreating(false)}
        />
      </Drawer>

      <Dialog
        fullWidth
        maxWidth="xs"
        open={!!flowToDelete}
        onClose={() => setFlowToDelete(undefined)}
      >
        <DialogTitle>
          {t('subscriptionFlow.overview.deleteTitle', {
            memberPlan: flowToDelete?.memberPlanName,
          })}
        </DialogTitle>

        <DialogContent>
          <Typography
            variant="body2"
            sx={{ marginBottom: 1 }}
          >
            {flowToDelete?.conditions}
          </Typography>

          {t('subscriptionFlow.deleteFlowQuestion')}
        </DialogContent>

        <DialogActions>
          <Button
            variant="text"
            onClick={() => setFlowToDelete(undefined)}
          >
            {t('cancel')}
          </Button>

          <Button
            variant="contained"
            color="error"
            loading={deleting}
            onClick={confirmDelete}
          >
            {t('subscriptionFlow.deletePermanently')}
          </Button>
        </DialogActions>
      </Dialog>
    </Section>
  );
}

/**
 * Everything the system sends on its own: the flows for subscriptions, the
 * default one and those of member plans, and the account mails. Each part
 * gates itself, so a user only sees what their permissions allow.
 */
export function SubscriptionFlowOverview() {
  const { t } = useTranslation();
  const canSeeFlows = useAuthorisation(CanGetSubscriptionFlows.id);
  const canChangeFlows = useAuthorisation(CanUpdateSubscriptionFlow.id);

  return (
    <>
      <PageTitle>{t('automaticMails.title')}</PageTitle>

      <Intro
        variant="body1"
        color="textSecondary"
      >
        {t('subscriptionFlow.overview.intro')}
      </Intro>

      {(canSeeFlows || canChangeFlows) && <FlowTable />}

      <SystemMailSection />
    </>
  );
}
