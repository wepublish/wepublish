import { useMutation, useQuery } from '@apollo/client/react';
import { Typography, CircularProgress, Box } from '@mui/material';
import {
  CreateSubscriptionFlowDocument,
  CreateSubscriptionIntervalDocument,
  DeleteSubscriptionFlowDocument,
  DeleteSubscriptionIntervalDocument,
  FullMemberPlanFragment,
  ListPaymentMethodsDocument,
  MailTemplateDocument,
  MemberPlanListDocument,
  SubscriptionEvent,
  SubscriptionFlowFragment,
  SubscriptionFlowsDocument,
  SubscriptionIntervalFragment,
  TinyMailTemplateFragment,
  UpdateSubscriptionFlowDocument,
  UpdateSubscriptionIntervalDocument,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  PermissionControl,
} from '@wepublish/ui/editor';
import { createContext, JSX, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAddCircleOutline,
  MdAltRoute,
  MdCelebration,
  MdTune,
} from 'react-icons/md';
import { useParams } from 'react-router-dom';
import { DEFAULT_MUTATION_OPTIONS, showErrors, useShowErrors } from '../common';
import { MailBlock, MailBlocks } from '../mail-settings-layout';
import { SystemMailSection } from '../system-mail/system-mail-section';
import { FlowFilters } from './filter/flow-filters';
import { FlowBlock } from './flow-block';
import { SubscriptionClientContext } from './graphql-client-context';
import styled from '@emotion/styled';

export const MailTemplatesContext = createContext<TinyMailTemplateFragment[]>(
  []
);

export const USER_ACTION_EVENTS = [
  SubscriptionEvent.Subscribe,
  SubscriptionEvent.ConfirmSubscription,
  SubscriptionEvent.RenewalSuccess,
  SubscriptionEvent.RenewalFailed,
  SubscriptionEvent.DeactivationByUser,
] as const;
type UserActionEvents = (typeof USER_ACTION_EVENTS)[number];

export const NON_USER_ACTION_EVENTS = [
  SubscriptionEvent.InvoiceCreation,
  SubscriptionEvent.DeactivationUnpaid,
  SubscriptionEvent.Custom,
] as const;
type NonUserActionEvents = (typeof NON_USER_ACTION_EVENTS)[number];

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

export function isNonUserEvent(
  event: SubscriptionEvent
): event is NonUserActionEvents {
  return NON_USER_ACTION_EVENTS.includes(event as NonUserActionEvents);
}

const PageIntro = styled.div`
  display: grid;
  gap: 6px;
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

interface SubscriptionFlowBlocksProps {
  memberPlanId?: string;
  defaultFlowOnly: boolean;
  memberPlan?: FullMemberPlanFragment;
}

function SubscriptionFlowBlocks({
  memberPlanId,
  defaultFlowOnly,
  memberPlan,
}: SubscriptionFlowBlocksProps) {
  const { t } = useTranslation();
  const countedMemberPlanId = defaultFlowOnly ? undefined : memberPlanId;

  const {
    data: subscriptionFlows,
    loading: loadingSubscriptionFlows,
    refetch: refetchSubscriptionFlows,
    error: subscriptionFlowsError,
  } = useQuery(SubscriptionFlowsDocument, {
    variables: {
      defaultFlowOnly,
      memberPlanId: countedMemberPlanId,
    },
  });
  useShowErrors(subscriptionFlowsError);

  const {
    data: mailTemplates,
    loading: loadingMailTemplates,
    error: mailTemplatesError,
  } = useQuery(MailTemplateDocument);
  const { data: paymentMethods, error: paymentMethodsError } = useQuery(
    ListPaymentMethodsDocument
  );

  useEffect(() => {
    if (mailTemplatesError) {
      showErrors(mailTemplatesError);
    }
  }, [mailTemplatesError]);

  useEffect(() => {
    if (paymentMethodsError) {
      showErrors(paymentMethodsError);
    }
  }, [paymentMethodsError]);

  // Mutation methods are later passed to the SubscriptionClientContext, so they can reuse the same client everywhere. This makes the GraphQL cache work across all requests.
  const mutationOptions = {
    ...DEFAULT_MUTATION_OPTIONS(t),
    variables: { memberPlanId: countedMemberPlanId },
  };

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
  const [createSubscriptionFlow] = useMutation(CreateSubscriptionFlowDocument, {
    ...DEFAULT_MUTATION_OPTIONS(t),
    onCompleted: () => refetchSubscriptionFlows(),
  });
  const [updateSubscriptionFlow] = useMutation(
    UpdateSubscriptionFlowDocument,
    mutationOptions
  );
  const [deleteSubscriptionFlow] = useMutation(DeleteSubscriptionFlowDocument, {
    ...mutationOptions,
    onCompleted: () => refetchSubscriptionFlows(),
  });

  const loading = useMemo(
    () => loadingSubscriptionFlows || loadingMailTemplates,
    [loadingSubscriptionFlows, loadingMailTemplates]
  );

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

  const knownFlowIds = useRef<Set<string>>(undefined);

  if (loading || !subscriptionFlows) {
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

  knownFlowIds.current ??= new Set(
    subscriptionFlows.subscriptionFlows.map(flow => flow.id)
  );

  const isNewFlow = (flow: SubscriptionFlowFragment) =>
    !knownFlowIds.current?.has(flow.id);

  const filterSummary = (flow: SubscriptionFlowFragment) =>
    [
      flow.paymentMethods.map(paymentMethod => paymentMethod.name).join(', '),
      flow.periodicities
        .map(periodicity =>
          t(`memberPlanList.paymentPeriodicity.${periodicity}`)
        )
        .join(', '),
      flow.autoRenewal
        .map(autoRenewal => t(`subscriptionFlow.booleanFilter.${autoRenewal}`))
        .join(', '),
    ]
      .filter(Boolean)
      .join(' · ');

  let flowNumber = 0;

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
        {subscriptionFlows.subscriptionFlows.map(subscriptionFlow => {
          if (defaultFlowOnly) {
            return (
              <FlowBlock
                key={subscriptionFlow.id}
                subscriptionFlow={subscriptionFlow}
                userActionEvents={userActionEvents}
                title={t('subscriptionFlow.subscriptionEvents')}
                icon={<MdCelebration size={20} />}
                description={t(
                  'subscriptionFlow.subscriptionEventsDescription'
                )}
                example={t('subscriptionFlow.subscriptionEventsExample')}
              />
            );
          }

          if (subscriptionFlow.default) {
            return (
              <FlowBlock
                key={subscriptionFlow.id}
                subscriptionFlow={subscriptionFlow}
                userActionEvents={userActionEvents}
                title={t('subscriptionFlow.defaultFlow')}
                icon={<MdAltRoute size={20} />}
                description={t('subscriptionFlow.defaultFlowDescription')}
                showAffected
                groupEvents
                collapsible
                defaultExpanded={isNewFlow(subscriptionFlow)}
              />
            );
          }

          flowNumber += 1;

          return (
            <FlowBlock
              key={subscriptionFlow.id}
              subscriptionFlow={subscriptionFlow}
              userActionEvents={userActionEvents}
              title={t('subscriptionFlow.flowNumber', { number: flowNumber })}
              icon={<MdAltRoute size={20} />}
              summary={filterSummary(subscriptionFlow)}
              collapsible
              defaultExpanded={isNewFlow(subscriptionFlow)}
              filters={
                memberPlan && (
                  <FlowFilters
                    memberPlan={memberPlan}
                    subscriptionFlow={subscriptionFlow}
                    paymentMethods={paymentMethods}
                  />
                )
              }
              showAffected
              groupEvents
            />
          );
        })}

        {!defaultFlowOnly && memberPlan && (
          <PermissionControl
            showRejectionMessage={false}
            qualifyingPermissions={['CAN_CREATE_SUBSCRIPTION_FLOW']}
          >
            <MailBlock
              title={t('subscriptionFlow.newFlow')}
              icon={<MdAddCircleOutline size={20} />}
              description={t('subscriptionFlow.filtersDescription')}
              example={t('subscriptionFlow.filtersExample')}
            >
              <FlowFilters
                memberPlan={memberPlan}
                createNewFlow
                paymentMethods={paymentMethods}
              />
            </MailBlock>
          </PermissionControl>
        )}
      </SubscriptionClientContext.Provider>
    </MailTemplatesContext.Provider>
  );
}

const CheckedSubscriptionFlowBlocks = createCheckedPermissionComponent([
  'CAN_GET_SUBSCRIPTION_FLOWS',
  'CAN_UPDATE_SUBSCRIPTION_FLOW',
  'CAN_CREATE_SUBSCRIPTION_FLOW',
  'CAN_DELETE_SUBSCRIPTION_FLOW',
])(SubscriptionFlowBlocks);

/**
 * All mails the system sends on its own: the account mails and, per member plan,
 * the subscription mails. Every section gates itself, so a user only sees what
 * their permissions allow.
 */
function SubscriptionFlowList() {
  const { t } = useTranslation();

  const { id: memberPlanId } = useParams();
  const defaultFlowOnly = memberPlanId === 'default';

  const { data: memberPlans } = useQuery(MemberPlanListDocument, {
    variables: { take: 100 },
    skip: defaultFlowOnly,
  });

  const memberPlan = useMemo(
    () => memberPlans?.memberPlans.nodes.find(p => p.id === memberPlanId),
    [memberPlanId, memberPlans]
  );

  return (
    <>
      <PageIntro>
        <h2>
          <MdTune />

          {defaultFlowOnly ?
            t('automaticMails.title')
          : `«${memberPlan?.name || ''}»`}
        </h2>

        <Typography
          variant="body1"
          color="textSecondary"
        >
          {defaultFlowOnly ?
            t('automaticMails.intro')
          : t('subscriptionFlow.settingsDescription')}
        </Typography>
      </PageIntro>

      <MailBlocks split={defaultFlowOnly}>
        <CheckedSubscriptionFlowBlocks
          memberPlanId={memberPlanId}
          defaultFlowOnly={defaultFlowOnly}
          memberPlan={memberPlan}
        />

        {defaultFlowOnly && <SystemMailSection />}
      </MailBlocks>
    </>
  );
}

export { SubscriptionFlowList };
