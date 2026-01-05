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
import { useMemberPlanListQuery } from '@wepublish/editor/api-v2';
import {
  FullMailTemplateFragment,
  getApiClientV2,
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
} from '@wepublish/editor/api-v2';
import {
  createCheckedPermissionComponent,
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
} from '@wepublish/ui/editor';
import { createContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdOutlineClose, MdOutlineNoteAdd, MdTune } from 'react-icons/md';
import { useParams } from 'react-router-dom';
import { Loader } from 'rsuite';
import { TypeAttributes } from 'rsuite/esm/@types/common';
import { DEFAULT_MUTATION_OPTIONS, DEFAULT_QUERY_OPTIONS } from '../common';
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
  description: string;
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
  bg: TypeAttributes.Color;
  fg: TypeAttributes.Color | string;
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

function SubscriptionFlowList() {
  const { t } = useTranslation();

  const params = useParams();
  const { id: memberPlanId } = params;
  const [newDay, setNewDay] = useState<number | undefined>(undefined);
  const client = getApiClientV2();
  const { data: memberPlans } = useMemberPlanListQuery({
    client,
    variables: { take: 100 },
  });

  const defaultFlowOnly = memberPlanId === 'default';

  const memberPlan = useMemo(() => {
    return (
      memberPlans &&
      memberPlans.memberPlans.nodes.find(p => p.id === memberPlanId)
    );
  }, [memberPlanId, memberPlans]);

  const {
    data: subscriptionFlows,
    loading: loadingSubscriptionFlows,
    refetch: refetchSubscriptionFlows,
  } = useSubscriptionFlowsQuery({
    ...DEFAULT_QUERY_OPTIONS(client),
    variables: {
      defaultFlowOnly,
      memberPlanId,
    },
  });

  const { data: mailTemplates, loading: loadingMailTemplates } =
    useMailTemplateQuery(DEFAULT_QUERY_OPTIONS(client));
  const { data: paymentMethods } = useListPaymentMethodsQuery(
    DEFAULT_QUERY_OPTIONS(client)
  );

  // Mutation methods are later passed to the SubscriptionClientContext, so they can reuse the same client everywhere. This makes the GraphQL cache work across all requests.
  const [createSubscriptionInterval] = useCreateSubscriptionIntervalMutation(
    DEFAULT_MUTATION_OPTIONS(client, t)
  );

  const [updateSubscriptionInterval] = useUpdateSubscriptionIntervalMutation(
    DEFAULT_MUTATION_OPTIONS(client, t)
  );
  const [deleteSubscriptionInterval] = useDeleteSubscriptionIntervalMutation(
    DEFAULT_MUTATION_OPTIONS(client, t)
  );
  const [createSubscriptionFlow] = useCreateSubscriptionFlowMutation({
    ...DEFAULT_MUTATION_OPTIONS(client, t),
    onCompleted: () => refetchSubscriptionFlows(),
  });
  const [updateSubscriptionFlow] = useUpdateSubscriptionFlowMutation(
    DEFAULT_MUTATION_OPTIONS(client, t)
  );
  const [deleteSubscriptionFlow] = useDeleteSubscriptionFlowMutation({
    ...DEFAULT_MUTATION_OPTIONS(client, t),
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
    return USER_ACTION_EVENTS.map(eventName => ({
      title: t(`subscriptionFlow.${eventName.toLowerCase()}`),
      description: t(`subscriptionFlow.${eventName.toLowerCase()}Description`),
      subscriptionEventKey: eventName,
    }));
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
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>
            <MdTune style={{ marginRight: '4px' }} />

            {defaultFlowOnly ?
              t('subscriptionFlow.titleDefaultSettings')
            : `«${memberPlan?.name || ''}»`}
          </h2>

          {!defaultFlowOnly && (
            <Typography variant="subtitle1">
              {t('subscriptionFlow.settingsDescription')}
            </Typography>
          )}
        </ListViewHeader>
      </ListViewContainer>

      <TableContainer style={{ marginTop: '16px', maxWidth: '100%' }}>
        <MailTemplatesContext.Provider
          value={mailTemplates?.mailTemplates || []}
        >
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
                    <TableCell
                      key={userActionEvent.subscriptionEventKey}
                      align="center"
                    >
                      {userActionEvent.title}
                    </TableCell>
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
    </>
  );
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_SUBSCRIPTION_FLOWS',
  'CAN_UPDATE_SUBSCRIPTION_FLOW',
  'CAN_CREATE_SUBSCRIPTION_FLOW',
  'CAN_DELETE_SUBSCRIPTION_FLOW',
])(SubscriptionFlowList);
export { CheckedPermissionComponent as SubscriptionFlowList };
