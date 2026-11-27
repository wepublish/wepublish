import { useMutation, useQuery } from '@apollo/client/react';
import {
  Alert,
  Box,
  CircularProgress,
  Link as MuiLink,
  Typography,
} from '@mui/material';
import {
  CreateSubscriptionFlowDocument,
  CreateSubscriptionIntervalDocument,
  DeleteSubscriptionFlowDocument,
  DeleteSubscriptionIntervalDocument,
  ListPaymentMethodsDocument,
  MailTemplateDocument,
  SubscriptionFlowsDocument,
  SubscriptionIntervalFragment,
  TinyMailTemplateFragment,
  UpdateSubscriptionFlowDocument,
  UpdateSubscriptionIntervalDocument,
} from '@wepublish/editor/api';
import { createCheckedPermissionComponent } from '@wepublish/ui/editor';
import { createContext, JSX, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAltRoute, MdArrowBack, MdCelebration } from 'react-icons/md';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DEFAULT_MUTATION_OPTIONS } from '../common';
import { usePaperLetterFlow } from '../delivery-mode/use-paper-letter-flow';
import { MailBlocks } from '../mail-settings-layout';
import { FlowFilters } from './filter/flow-filters';
import { FlowBlock } from './flow-block';
import { USER_ACTION_EVENTS } from './flow-events';
import type { NonUserActionEvents, UserActionEvents } from './flow-events';
import { conditionsSummary, FLOWS_PATH, flowWarnings } from './flow-overview';
import { SubscriptionClientContext } from './graphql-client-context';
import styled from '@emotion/styled';
import {
  CanCreateSubscriptionFlow,
  CanDeleteSubscriptionFlow,
  CanGetSubscriptionFlows,
  CanUpdateSubscriptionFlow,
} from '@wepublish/permissions';

export const MailTemplatesContext = createContext<TinyMailTemplateFragment[]>(
  []
);

export {
  isNonUserEvent,
  NON_USER_ACTION_EVENTS,
  USER_ACTION_EVENTS,
} from './flow-events';

export interface UserActionEvent {
  title: string;
  hint: string;
  description: string;
  example: string;
  subscriptionEventKey: UserActionEvents;
}

export interface UserActionInterval extends SubscriptionIntervalFragment {
  event: UserActionEvents;
  daysAwayFromEnding: null;
}

export interface NonUserActionInterval extends SubscriptionIntervalFragment {
  event: NonUserActionEvents;
  daysAwayFromEnding: number;
}

const PageIntro = styled.div`
  display: grid;
  gap: 6px;

  /* The way back stands apart from the title it leads away from. */
  > a:first-of-type {
    margin-bottom: ${({ theme }) => theme.spacing(2)};
  }
  max-width: 880px;

  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
  }
`;

export interface IntervalColoring {
  accent: string;
}

export interface DecoratedSubscriptionInterval<
  T extends SubscriptionIntervalFragment,
> {
  subscriptionFlowId: string;
  title: string;
  object: T;
  icon: JSX.Element;
  color: IntervalColoring;
}

/**
 * One communication flow: the default one, or one a member plan has for some
 * of its subscriptions. Which flows exist is the overview's business.
 */
function SubscriptionFlow() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const paperLetterFlow = usePaperLetterFlow();

  const { id } = useParams();
  const defaultFlowOnly = id === 'default';

  // There is no query for a single flow; the default flow can at least be
  // asked for alone.
  const { data: subscriptionFlows, loading: loadingSubscriptionFlows } =
    useQuery(SubscriptionFlowsDocument, {
      variables: { defaultFlowOnly },
    });

  const { data: mailTemplates, loading: loadingMailTemplates } =
    useQuery(MailTemplateDocument);
  const { data: paymentMethods } = useQuery(ListPaymentMethodsDocument);

  // Mutation methods are later passed to the SubscriptionClientContext, so they can reuse the same client everywhere. This makes the GraphQL cache work across all requests.
  const mutationOptions = DEFAULT_MUTATION_OPTIONS(t);

  const [createSubscriptionInterval] = useMutation(
    CreateSubscriptionIntervalDocument,
    mutationOptions
  );
  const [updateSubscriptionInterval] = useMutation(
    UpdateSubscriptionIntervalDocument,
    mutationOptions
  );
  const [deleteSubscriptionInterval] = useMutation(
    DeleteSubscriptionIntervalDocument,
    mutationOptions
  );
  const [createSubscriptionFlow] = useMutation(
    CreateSubscriptionFlowDocument,
    mutationOptions
  );
  const [updateSubscriptionFlow] = useMutation(
    UpdateSubscriptionFlowDocument,
    mutationOptions
  );
  const [deleteSubscriptionFlow] = useMutation(DeleteSubscriptionFlowDocument, {
    ...mutationOptions,
    // The page of a deleted flow has nothing left to show.
    onCompleted: () => navigate(FLOWS_PATH),
  });

  const userActionEvents: UserActionEvent[] = useMemo(() => {
    return USER_ACTION_EVENTS.map(eventName => {
      const eventKey = eventName.toLowerCase();

      return {
        title: t(`subscriptionFlow.${eventKey}`),
        hint: t(`subscriptionFlow.eventInfo.${eventKey}.short`),
        description: t(`subscriptionFlow.eventInfo.${eventKey}.description`),
        example: t(`subscriptionFlow.eventInfo.${eventKey}.example`),
        subscriptionEventKey: eventName,
      };
    });
  }, [t]);

  if (loadingSubscriptionFlows || loadingMailTemplates || !subscriptionFlows) {
    return (
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const subscriptionFlow = subscriptionFlows.subscriptionFlows.find(flow =>
    defaultFlowOnly ? flow.default : flow.id === id
  );

  const backLink = (
    <MuiLink
      component={Link}
      to={FLOWS_PATH}
      variant="body2"
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
    >
      <MdArrowBack aria-hidden />
      {t('subscriptionFlow.overview.back')}
    </MuiLink>
  );

  if (!subscriptionFlow) {
    return (
      <PageIntro>
        {backLink}

        <Typography
          variant="body1"
          color="textSecondary"
        >
          {t('subscriptionFlow.notFound')}
        </Typography>
      </PageIntro>
    );
  }

  const conditions = conditionsSummary(subscriptionFlow, t);
  const warnings = flowWarnings(subscriptionFlow, t);

  return (
    <MailTemplatesContext.Provider value={mailTemplates?.mailTemplates || []}>
      <SubscriptionClientContext.Provider
        value={{
          createSubscriptionInterval,
          updateSubscriptionInterval,
          deleteSubscriptionInterval,
          createSubscriptionFlow,
          updateSubscriptionFlow,
          deleteSubscriptionFlow,
        }}
      >
        <PageIntro>
          {backLink}

          <Typography
            variant="h2"
            component="h1"
          >
            {subscriptionFlow.default ?
              t('subscriptionFlow.defaultFlow')
            : subscriptionFlow.memberPlan ?
              `«${subscriptionFlow.memberPlan.name}»`
            : subscriptionFlow.allMemberPlans ?
              t('subscriptionFlow.overview.allMemberPlans')
            : t('subscriptionFlow.overview.noMemberPlan')}
          </Typography>

          {/* A flow has no name: its conditions tell it from the plan's
              other flows. */}
          {conditions && (
            <Typography
              variant="subtitle1"
              component="p"
            >
              {conditions}
            </Typography>
          )}

          <Typography
            variant="body1"
            color="textSecondary"
          >
            {subscriptionFlow.default ?
              t('subscriptionFlow.defaultFlowDescription')
            : [
                subscriptionFlow.memberPlan ?
                  t('subscriptionFlow.planFlowDescriptionFor', {
                    memberPlan: subscriptionFlow.memberPlan.name,
                  })
                : subscriptionFlow.allMemberPlans ?
                  t('subscriptionFlow.allPlansFlowDescription')
                : t('subscriptionFlow.planFlowDescription'),
                t('subscriptionFlow.noFallback'),
              ].join(' ')
            }
          </Typography>

          {warnings.map(warning => (
            <Alert
              key={warning}
              severity="warning"
            >
              {warning}
            </Alert>
          ))}
        </PageIntro>

        <MailBlocks>
          {/* Which messages print at all is decided here, per event; who gets
              them printed is decided in the delivery channel area. */}
          {paperLetterFlow && (
            // One quiet line across the whole grid, not a block of its own.
            <Typography
              variant="caption"
              sx={{ gridColumn: '1 / -1', color: 'text.secondary' }}
            >
              {t('deliveryChannel.flows.letterHint')}{' '}
              <MuiLink
                component={Link}
                to="/deliverychannel"
                variant="caption"
              >
                {t('deliveryChannel.flows.manage')}
              </MuiLink>
            </Typography>
          )}

          {subscriptionFlow.default ?
            <FlowBlock
              subscriptionFlow={subscriptionFlow}
              userActionEvents={userActionEvents}
              title={t('subscriptionFlow.subscriptionEvents')}
              icon={<MdCelebration size={20} />}
              description={t('subscriptionFlow.subscriptionEventsDescription')}
              example={t('subscriptionFlow.subscriptionEventsExample')}
              showAffected
            />
          : <FlowBlock
              subscriptionFlow={subscriptionFlow}
              userActionEvents={userActionEvents}
              title={t('subscriptionFlow.flow')}
              icon={<MdAltRoute size={20} />}
              filters={
                (subscriptionFlow.memberPlan ||
                  subscriptionFlow.allMemberPlans) && (
                  <FlowFilters
                    memberPlan={subscriptionFlow.memberPlan ?? undefined}
                    subscriptionFlow={subscriptionFlow}
                    paymentMethods={paymentMethods}
                  />
                )
              }
              showAffected
              groupEvents
            />
          }
        </MailBlocks>
      </SubscriptionClientContext.Provider>
    </MailTemplatesContext.Provider>
  );
}

const SubscriptionFlowPage = createCheckedPermissionComponent([
  CanGetSubscriptionFlows.id,
  CanUpdateSubscriptionFlow.id,
  CanCreateSubscriptionFlow.id,
  CanDeleteSubscriptionFlow.id,
])(SubscriptionFlow);

export { SubscriptionFlowPage };
