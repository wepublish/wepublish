import styled from '@emotion/styled';
import {
  SubscriptionEvent,
  SubscriptionFlowFragment,
} from '@wepublish/editor/api';
import { PermissionControl, useAuthorisation } from '@wepublish/ui/editor';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdAlarmOn, MdCheck, MdEdit, MdRefresh } from 'react-icons/md';
import {
  Button,
  IconButton,
  NumberInput,
  Popover,
  Whisper,
  type WhisperInstance,
} from 'rsuite';
import { MailSubsection } from '../../mail-settings-layout';
import { DraggableSubscriptionInterval } from '../draggable-subscription-interval';
import { DroppableSubscriptionInterval } from '../droppable-subscription-interval';
import { SubscriptionClientContext } from '../graphql-client-context';
import { decorateInterval, timelineDays } from '../interval-decoration';
import {
  MailTemplatesContext,
  NonUserActionInterval,
} from '../subscription-flow-list';

const DayList = styled('ol')`
  margin: 0;
  padding: 8px 20px 16px;
  list-style: none;
`;

const DayRow = styled('li')<{ renewal: boolean }>`
  position: relative;
  display: grid;
  gap: 8px 16px;
  padding: 10px 12px 10px 36px;
  border-radius: var(--rs-radius-md);
  background-color: ${({ renewal }) =>
    renewal ? 'rgb(from var(--rs-primary-500) r g b / 7%)' : 'transparent'};

  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 15px;
    width: 2px;
    background-color: var(--rs-border-primary);
  }

  &:first-of-type::before {
    top: 24px;
  }

  &:last-of-type::before {
    bottom: calc(100% - 24px);
  }

  &:only-of-type::before {
    display: none;
  }

  &::after {
    content: '';
    position: absolute;
    top: 18px;
    left: 10px;
    box-sizing: border-box;
    width: 12px;
    height: 12px;
    border: 2px solid
      ${({ renewal }) =>
        renewal ? 'var(--rs-primary-500)' : 'var(--rs-border-secondary)'};
    border-radius: 50%;
    background-color: ${({ renewal }) =>
      renewal ? 'var(--rs-primary-500)' : 'var(--rs-bg-card)'};
  }

  @container (min-width: 620px) {
    grid-template-columns: 180px minmax(0, 1fr);
    align-items: start;
  }
`;

const DayLabel = styled('div')`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 6px;
  min-height: 28px;
`;

const DayName = styled('span')`
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--rs-text-heading);
`;

const RenewalHint = styled('span')`
  display: inline-flex;
  flex-basis: 100%;
  align-items: flex-start;
  gap: 4px;
  font-size: 12px;
  line-height: 1.35;
  color: var(--rs-primary-500);

  > svg {
    flex-shrink: 0;
    margin-top: 1px;
  }
`;

const PopoverBody = styled('div')`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 170px;
`;

const NewDayBody = styled('div')`
  display: grid;
  gap: 8px;
  width: min(300px, calc(100vw - 48px));
  padding: 4px;

  h6 {
    margin: 0;
  }
`;

const NewDayForm = styled('div')`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  margin-top: 4px;
`;

const AddMail = styled('div')`
  justify-self: start;
`;

const NewDayHint = styled('span')`
  font-size: 12px;
  line-height: 1.4;
  color: var(--rs-text-secondary);
`;

interface AddDayProps {
  onAdd(day: number): void;
}

function AddDay({ onAdd }: AddDayProps) {
  const { t } = useTranslation();
  const whisper = useRef<WhisperInstance>(null);
  const [day, setDay] = useState(-3);

  return (
    <PermissionControl qualifyingPermissions={['CAN_UPDATE_SUBSCRIPTION_FLOW']}>
      <Whisper
        ref={whisper}
        placement="bottomEnd"
        trigger="click"
        speaker={
          <Popover>
            <NewDayBody>
              <h6>{t('subscriptionFlow.newDayTitle')}</h6>

              <NewDayHint>{t('subscriptionFlow.newDayHint')}</NewDayHint>

              <NewDayForm>
                <NumberInput
                  defaultValue={day}
                  onChange={value => setDay(+(value ?? 0))}
                  step={1}
                />

                <Button
                  appearance="primary"
                  startIcon={<MdAdd />}
                  onClick={() => {
                    onAdd(day);
                    whisper.current?.close();
                  }}
                >
                  {t('subscriptionFlow.add')}
                </Button>
              </NewDayForm>
            </NewDayBody>
          </Popover>
        }
      >
        <Button
          size="sm"
          appearance="ghost"
          startIcon={<MdAdd />}
        >
          {t('subscriptionFlow.addDay')}
        </Button>
      </Whisper>
    </PermissionControl>
  );
}

interface EditDayProps {
  day: number;
  subscriptionFlow: SubscriptionFlowFragment;
}

function EditDay({ day, subscriptionFlow }: EditDayProps) {
  const { t } = useTranslation();
  const canUpdateSubscriptionFlow = useAuthorisation(
    'CAN_UPDATE_SUBSCRIPTION_FLOW'
  );
  const client = useContext(SubscriptionClientContext);
  const editDay = useRef<number | undefined>(undefined);

  if (!canUpdateSubscriptionFlow) {
    return null;
  }

  async function updateTimelineDay() {
    if (editDay.current === undefined) {
      return;
    }

    const intervalsToUpdate = subscriptionFlow.intervals.filter(
      interval => interval.daysAwayFromEnding === day
    );

    await Promise.all(
      intervalsToUpdate.map(intervalToUpdate =>
        client.updateSubscriptionInterval({
          variables: {
            id: intervalToUpdate.id,
            mailTemplateId: intervalToUpdate.mailTemplate?.id,
            daysAwayFromEnding: editDay.current,
          },
        })
      )
    );
  }

  return (
    <Whisper
      placement="bottomStart"
      trigger="click"
      onClose={() => (editDay.current = undefined)}
      speaker={
        <Popover>
          <PopoverBody>
            <NumberInput
              onChange={value => (editDay.current = +(value ?? 0))}
              size="sm"
              defaultValue={day}
              step={1}
              postfix={t('subscriptionFlow.days')}
            />

            <IconButton
              icon={<MdCheck />}
              color="green"
              appearance="primary"
              size="sm"
              onClick={updateTimelineDay}
            />
          </PopoverBody>
        </Popover>
      }
    >
      <IconButton
        icon={<MdEdit />}
        size="sm"
        circle
        appearance="subtle"
        aria-label={t('subscriptionFlow.editDay')}
      />
    </Whisper>
  );
}

interface TimelineProps {
  subscriptionFlow: SubscriptionFlowFragment;
}

interface PendingMail {
  day: number;
  mailsOnDay: number;
}

export function Timeline({ subscriptionFlow }: TimelineProps) {
  const { t } = useTranslation();
  const mailTemplates = useContext(MailTemplatesContext);
  const [pendingMail, setPendingMail] = useState<PendingMail>();

  const mailsOnDay = (day: number) =>
    subscriptionFlow.intervals.filter(
      interval => interval.daysAwayFromEnding === day
    ).length;

  const pendingMailSaved =
    !!pendingMail && mailsOnDay(pendingMail.day) > pendingMail.mailsOnDay;

  useEffect(() => {
    if (pendingMailSaved) {
      setPendingMail(undefined);
    }
  }, [pendingMailSaved]);

  const addMail = (day: number) =>
    setPendingMail({ day, mailsOnDay: mailsOnDay(day) });

  const days = useMemo(
    () => timelineDays(subscriptionFlow.intervals, pendingMail?.day),
    [subscriptionFlow.intervals, pendingMail?.day]
  );

  return (
    <MailSubsection
      title={t('subscriptionFlow.timeline')}
      icon={<MdAlarmOn size={16} />}
      description={t('subscriptionFlow.timelineDescription')}
      example={t('subscriptionFlow.timelineExample')}
      actions={<AddDay onAdd={addMail} />}
    >
      <DayList>
        {days.map(day => {
          const intervals = subscriptionFlow.intervals
            .filter(interval => interval.daysAwayFromEnding === day)
            .map(interval =>
              decorateInterval(
                interval as NonUserActionInterval,
                subscriptionFlow.id,
                t(`subscriptionFlow.${interval.event.toLowerCase()}`)
              )
            );
          const pending = pendingMail?.day === day && !pendingMailSaved;

          return (
            <DayRow
              key={day}
              renewal={day === 0}
            >
              <DayLabel>
                <DayName>
                  {t('subscriptionFlow.dayWithNumber', { day })}
                </DayName>

                {day === 0 ?
                  <RenewalHint>
                    <MdRefresh size={14} />
                    {t('subscriptionFlow.dayOfRenewal')}
                  </RenewalHint>
                : <EditDay
                    day={day}
                    subscriptionFlow={subscriptionFlow}
                  />
                }
              </DayLabel>

              <DroppableSubscriptionInterval dayIndex={day}>
                {intervals.map(interval => (
                  <DraggableSubscriptionInterval
                    key={interval.object.id}
                    subscriptionInterval={interval}
                    subscriptionFlow={subscriptionFlow}
                    mailTemplates={mailTemplates}
                  />
                ))}

                {(pending || !intervals.length) && (
                  <DraggableSubscriptionInterval
                    mailTemplates={mailTemplates}
                    subscriptionInterval={undefined}
                    subscriptionFlow={subscriptionFlow}
                    event={SubscriptionEvent.Custom}
                    newDaysAwayFromEnding={day}
                    onRemove={
                      pending ? () => setPendingMail(undefined) : undefined
                    }
                  />
                )}

                {!pending && !!intervals.length && (
                  <PermissionControl
                    qualifyingPermissions={['CAN_UPDATE_SUBSCRIPTION_FLOW']}
                  >
                    <AddMail>
                      <Button
                        size="xs"
                        appearance="subtle"
                        startIcon={<MdAdd />}
                        onClick={() => addMail(day)}
                      >
                        {t('subscriptionFlow.addMail')}
                      </Button>
                    </AddMail>
                  </PermissionControl>
                )}
              </DroppableSubscriptionInterval>
            </DayRow>
          );
        })}
      </DayList>
    </MailSubsection>
  );
}
