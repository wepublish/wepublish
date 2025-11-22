import { TableCell } from '@mui/material';
import styled from '@emotion/styled';
import { SubscriptionInterval } from '@wepublish/editor/api-v2';
import { useAuthorisation } from '@wepublish/ui/editor';
import { useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MdCheck, MdEdit, MdRefresh } from 'react-icons/md';
import { IconButton, InputNumber, Popover, Tag, Whisper } from 'rsuite';
import { SubscriptionClientContext } from '../graphql-client-context';

interface FlowHeadProps {
  days: (number | null | undefined)[];
  intervals: SubscriptionInterval[];
}

const PopoverBody = styled('div')`
  display: flex;
  align-items: center;
  min-width: 170px;
`;

export function TimelineHead({ days, intervals }: FlowHeadProps) {
  const { t } = useTranslation();
  const canUpdateSubscriptionFlow = useAuthorisation(
    'CAN_UPDATE_SUBSCRIPTION_FLOW'
  );
  const editDay = useRef<number | undefined>(undefined);
  const client = useContext(SubscriptionClientContext);

  async function updateTimelineDay(dayToUpdate: number) {
    if (editDay.current === undefined) {
      return;
    }

    const intervalsToUpdate = intervals.filter(
      interval => interval?.daysAwayFromEnding === dayToUpdate
    );

    await Promise.all(
      intervalsToUpdate.map(intervalToUpdate => {
        return client.updateSubscriptionInterval({
          variables: {
            id: intervalToUpdate.id,
            mailTemplateId: intervalToUpdate.mailTemplate?.id,
            daysAwayFromEnding: editDay.current,
          },
        });
      })
    );
  }

  return (
    <>
      {days.map(day => (
        <TableCell
          key={`day-${day}`}
          align="center"
          style={day === 0 ? { backgroundColor: 'lightyellow' } : {}}
        >
          {t('subscriptionFlow.dayWithNumber', { day })}
          {/* show badge on zero day */}
          {!day && (
            <>
              <br />
              <Tag color="blue">
                <MdRefresh
                  size={20}
                  style={{ marginRight: '5px' }}
                />
                {t('subscriptionFlow.dayOfRenewal')}
              </Tag>
            </>
          )}

          {!!day && canUpdateSubscriptionFlow && (
            <Whisper
              placement="bottom"
              trigger="click"
              onClose={() => (editDay.current = undefined)}
              speaker={
                <Popover>
                  <PopoverBody>
                    <InputNumber
                      onChange={value => (editDay.current = +value)}
                      size="sm"
                      defaultValue={day ?? 0}
                      step={1}
                      postfix={t('subscriptionFlow.days')}
                    />

                    <IconButton
                      icon={<MdCheck />}
                      color={'green'}
                      appearance={'primary'}
                      size="sm"
                      style={{ marginLeft: '5px' }}
                      onClick={() => updateTimelineDay(day ?? 0)}
                    />
                  </PopoverBody>
                </Popover>
              }
            >
              <IconButton
                icon={<MdEdit />}
                size={'sm'}
                circle
                color={'blue'}
                appearance={'link'}
              />
            </Whisper>
          )}
        </TableCell>
      ))}
    </>
  );
}
