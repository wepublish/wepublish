import { DndContext, DragEndEvent } from '@dnd-kit/core';
import {
  Table,
  TableBody,
  TableCell,
  tableCellClasses,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useMemberPlanListQuery } from '@wepublish/editor/api';
import {
  FullMailTemplateFragment,
  FullMemberPlanFragment,
  SubscriptionEvent,
  SubscriptionInterval,
  useCreateSubscriptionFlowMutation,
  useCreateSubscriptionIntervalMutation,
  useDeleteSubscriptionFlowMutation,
  useDeleteSubscriptionIntervalMutation,
  useListPaymentMethodsQuery,
  useMailTemplateQuery,
  useSubscriptionFlowsQuery,
  useUpdateSubscriptionFlowMutation,
  useUpdateSubscriptionIntervalMutation,
} from '@wepublish/editor/api';
import {
  createCheckedPermissionComponent,
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
} from '@wepublish/ui/editor';
import { createContext, JSX, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdOutlineClose, MdOutlineNoteAdd, MdTune } from 'react-icons/md';
import { useParams } from 'react-router-dom';
import { Loader } from 'rsuite';
import type { Color } from 'rsuite/esm/internals/types';
import { DEFAULT_MUTATION_OPTIONS, DEFAULT_QUERY_OPTIONS } from '../common';
import { EventHeadCell, EventTableCell } from '../mail-settings-layout';
import { SystemMailSection } from '../system-mail/system-mail-section';
import { DeleteSubscriptionFlow } from './delete-subscription-flow';
import { EventsBody } from './events/events-body';
import { EventsHead } from './events/events-head';
import { FilterBody } from './filter/filter-body';
import { FilterHead } from './filter/filter-head';
import { SubscriptionClientContext } from './graphql-client-context';
import { SubscriptionFlowHeadline } from './subscription-flow-headline';
import { TimelineBody } from './timeline/timeline-body';
import { TimelineHead } from './timeline/timeline-head';
import styled from '@emotion/styled';

export const MailTemplatesContext = createContext<FullMailTemplateFragment[]>(
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

export interface UserActionInterval extends SubscriptionInterval {
  event: UserActionEvents;
  daysAwayFromEnding: null;
}

export interface NonUserActionInterval extends SubscriptionInterval {
  event: NonUserActionEvents;
  daysAwayFromEnding: number;
}

export function isNonUserEvent(
  event: SubscriptionEvent
): event is NonUserActionEvents {
  return NON_USER_ACTION_EVENTS.includes(event as NonUserActionEvents);
}

export interface IntervalColoring {
  bg: Color;
  fg: Color | string;
}

const eventIcons: Record<string, JSX.Element> = {
  [SubscriptionEvent.InvoiceCreation]: <MdOutlineNoteAdd size={16} />,
  [SubscriptionEvent.DeactivationUnpaid]: <MdOutlineClose size={16} />,
};

const eventColors: Record<string, IntervalColoring> = {
  [SubscriptionEvent.InvoiceCreation]: { bg: 'green', fg: 'white' },
  [SubscriptionEvent.DeactivationUnpaid]: { bg: 'orange', fg: 'white' },
};

export interface DecoratedSubscriptionInterval<T extends SubscriptionInterval> {
  subscriptionFlowId: string;
  title: string;
  object: T;
  icon: JSX.Element;
  color: IntervalColoring;
}

interface SubscriptionFlowTableProps {
  memberPlanId?: string;
  defaultFlowOnly: boolean;
  memberPlan?: FullMemberPlanFragment;
}

function SubscriptionFlowTable({
  memberPlanId,
  defaultFlowOnly,
  memberPlan,
}: SubscriptionFlowTableProps) {
  const { t } = useTranslation();

  const [newDay, setNewDay] = useState<number | undefined>(undefined);

  const {
    data: subscriptionFlows,
    loading: loadingSubscriptionFlows,
    refetch: refetchSubscriptionFlows,
  } = useSubscriptionFlowsQuery({
    ...DEFAULT_QUERY_OPTIONS(),
    variables: {
      defaultFlowOnly,
      memberPlanId,
    },
  });

  const { data: mailTemplates, loading: loadingMailTemplates } =
    useMailTemplateQuery(DEFAULT_QUERY_OPTIONS());
  const { data: paymentMethods } = useListPaymentMethodsQuery(
    DEFAULT_QUERY_OPTIONS()
  );

  // Mutation methods are later passed to the SubscriptionClientContext, so they can reuse the same client everywhere. This makes the GraphQL cache work across all requests.
  const [createSubscriptionInterval] = useCreateSubscriptionIntervalMutation(
    DEFAULT_MUTATION_OPTIONS(t)
  );

  const [updateSubscriptionInterval] = useUpdateSubscriptionIntervalMutation(
    DEFAULT_MUTATION_OPTIONS(t)
  );
  const [deleteSubscriptionInterval] = useDeleteSubscriptionIntervalMutation(
    DEFAULT_MUTATION_OPTIONS(t)
  );
  const [createSubscriptionFlow] = useCreateSubscriptionFlowMutation({
    ...DEFAULT_MUTATION_OPTIONS(t),
    onCompleted: () => refetchSubscriptionFlows(),
  });
  const [updateSubscriptionFlow] = useUpdateSubscriptionFlowMutation(
    DEFAULT_MUTATION_OPTIONS(t)
  );
  const [deleteSubscriptionFlow] = useDeleteSubscriptionFlowMutation({
    ...DEFAULT_MUTATION_OPTIONS(t),
    onCompleted: () => refetchSubscriptionFlows(),
  });

  async function intervalDragEnd(dragEvent: DragEndEvent) {
    const interval: DecoratedSubscriptionInterval<NonUserActionInterval> =
      dragEvent.active.data.current
        ?.decoratedSubscriptionInterval as DecoratedSubscriptionInterval<NonUserActionInterval>;
    const daysAwayFromEnding = dragEvent.over?.data.current?.dayIndex;

    await updateSubscriptionInterval({
      variables: {
        id: interval.object.id,
        daysAwayFromEnding,
        mailTemplateId: interval.object.mailTemplate?.id,
      },
    });
  }

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

  const intervals: SubscriptionInterval[] = useMemo(() => {
    if (!subscriptionFlows) {
      return [];
    }

    let intervals: SubscriptionInterval[] = [];
    for (const flow of subscriptionFlows.subscriptionFlows) {
      intervals = intervals.concat(flow.intervals);
    }

    return intervals;
  }, [subscriptionFlows]);

  const days = useMemo(() => {
    // Take existing intervals, maybe insert new day, drop all empty days, always show zero day and sort ascending
    const days = intervals
      .map(i => i.daysAwayFromEnding)
      .concat([newDay, 0])
      .filter((interval): interval is number => interval != null)
      .sort((a, b) => a - b);

    return days.filter((value, index, array) => array.indexOf(value) === index);
  }, [intervals, newDay]);

  // Add a separation border after every table section (filters | user actions | timeline | actions)
  const filterCount = defaultFlowOnly ? 0 : 4;
  const userActionCount = userActionEvents.length;
  const nonUserActionCount = days.length;

  const SplitTableRow = styled(TableRow)(({ theme }) => ({
    [`.${tableCellClasses.head}`]: {
      backgroundColor: theme.palette.action.hover,
    },

    [`.${tableCellClasses.head}:nth-of-type(${filterCount}), .${
      tableCellClasses.head
    }:nth-of-type(${filterCount + userActionCount}), .${tableCellClasses.head}:nth-of-type(${
      filterCount + userActionCount + nonUserActionCount
    })`]: {
      borderRight: `1px solid #000`,
    },

    [`.${tableCellClasses.body}:nth-of-type(${filterCount}), .${
      tableCellClasses.body
    }:nth-of-type(${filterCount + userActionCount}), .${tableCellClasses.body}:nth-of-type(${
      filterCount + userActionCount + nonUserActionCount
    })`]: {
      borderRight: `1px solid #000`,
    },
  }));

  if (loading || !subscriptionFlows) {
    return <Loader center />;
  }

  return (
    <TableContainer style={{ marginTop: '16px', maxWidth: '100%' }}>
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
          <Table size="small">
            <TableHead>
              <TableRow>
                <SubscriptionFlowHeadline
                  defaultFlowOnly={defaultFlowOnly}
                  userActionCount={userActionCount}
                  filterCount={filterCount}
                  nonUserActionCount={nonUserActionCount}
                />
              </TableRow>

              <SplitTableRow>
                {!defaultFlowOnly && <FilterHead />}

                {userActionEvents.map(userActionEvent => (
                  <EventTableCell
                    key={userActionEvent.subscriptionEventKey}
                    align="center"
                  >
                    <EventHeadCell
                      title={userActionEvent.title}
                      hint={userActionEvent.hint}
                      description={userActionEvent.description}
                      example={userActionEvent.example}
                    />
                  </EventTableCell>
                ))}

                <TimelineHead
                  days={days}
                  intervals={intervals}
                />
                <EventsHead setNewDay={setNewDay} />
              </SplitTableRow>
            </TableHead>

            <TableBody>
              {subscriptionFlows.subscriptionFlows.map(subscriptionFlow => (
                <SplitTableRow key={subscriptionFlow.id}>
                  <DndContext onDragEnd={event => intervalDragEnd(event)}>
                    {memberPlan && !defaultFlowOnly && (
                      <FilterBody
                        memberPlan={memberPlan}
                        subscriptionFlow={subscriptionFlow}
                        paymentMethods={paymentMethods}
                      />
                    )}

                    <EventsBody
                      subscriptionFlow={subscriptionFlow}
                      userActionEvents={userActionEvents}
                      eventIcons={eventIcons}
                      eventColors={eventColors}
                    />

                    <TimelineBody
                      subscriptionFlow={subscriptionFlow}
                      days={days}
                      eventIcons={eventIcons}
                      eventColors={eventColors}
                    />

                    <TableCell align="center">
                      {!subscriptionFlow.default && (
                        <DeleteSubscriptionFlow
                          subscriptionFlow={subscriptionFlow}
                        />
                      )}
                    </TableCell>
                  </DndContext>
                </SplitTableRow>
              ))}
            </TableBody>

            {!defaultFlowOnly && (
              <PermissionControl
                showRejectionMessage={false}
                qualifyingPermissions={['CAN_CREATE_SUBSCRIPTION_FLOW']}
              >
                <TableBody>
                  <SplitTableRow>
                    {memberPlan && (
                      <FilterBody
                        memberPlan={memberPlan}
                        createNewFlow
                        paymentMethods={paymentMethods}
                      />
                    )}
                  </SplitTableRow>
                </TableBody>
              </PermissionControl>
            )}
          </Table>
        </SubscriptionClientContext.Provider>
      </MailTemplatesContext.Provider>
    </TableContainer>
  );
}

const CheckedSubscriptionFlowTable = createCheckedPermissionComponent([
  'CAN_GET_SUBSCRIPTION_FLOWS',
  'CAN_UPDATE_SUBSCRIPTION_FLOW',
  'CAN_CREATE_SUBSCRIPTION_FLOW',
  'CAN_DELETE_SUBSCRIPTION_FLOW',
])(SubscriptionFlowTable);

/**
 * All mails the system sends on its own: the account mails and, per member plan,
 * the subscription mails. Every section gates itself, so a user only sees what
 * their permissions allow.
 */
function SubscriptionFlowList() {
  const { t } = useTranslation();

  const { id: memberPlanId } = useParams();
  const defaultFlowOnly = memberPlanId === 'default';

  const { data: memberPlans } = useMemberPlanListQuery({
    variables: { take: 100 },
    skip: defaultFlowOnly,
  });

  const memberPlan = useMemo(
    () => memberPlans?.memberPlans.nodes.find(p => p.id === memberPlanId),
    [memberPlanId, memberPlans]
  );

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>
            <MdTune style={{ marginRight: '4px' }} />

            {defaultFlowOnly ?
              t('automaticMails.title')
            : `«${memberPlan?.name || ''}»`}
          </h2>

          <Typography variant="subtitle1">
            {defaultFlowOnly ?
              t('automaticMails.intro')
            : t('subscriptionFlow.settingsDescription')}
          </Typography>
        </ListViewHeader>
      </ListViewContainer>

      {defaultFlowOnly && <SystemMailSection />}

      <CheckedSubscriptionFlowTable
        memberPlanId={memberPlanId}
        defaultFlowOnly={defaultFlowOnly}
        memberPlan={memberPlan}
      />
    </>
  );
}

export { SubscriptionFlowList };
