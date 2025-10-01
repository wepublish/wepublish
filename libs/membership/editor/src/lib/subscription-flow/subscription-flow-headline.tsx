import React from 'react';
import { MdAlarmOn, MdCelebration, MdFilterAlt } from 'react-icons/md';
import { TableCell } from '@mui/material';
import styled from '@emotion/styled';
import { useTranslation } from 'react-i18next';
import { PermissionControl } from '@wepublish/ui/editor';

const DarkTableCell = styled(TableCell)`
  background-color: ${({ theme }) => theme.palette.common.black};
  color: ${({ theme }) => theme.palette.common.white};
  border-right: 1px solid ${({ theme }) => theme.palette.common.white};
`;

interface SubscriptionFlowHeadlineProps {
  defaultFlowOnly?: boolean;
  filterCount: number;
  userActionCount: number;
  nonUserActionCount: number;
}

export function SubscriptionFlowHeadline({
  defaultFlowOnly,
  filterCount,
  userActionCount,
  nonUserActionCount,
}: SubscriptionFlowHeadlineProps) {
  const { t } = useTranslation();

  return (
    <>
      {!defaultFlowOnly && (
        <DarkTableCell
          align="center"
          colSpan={filterCount}
        >
          <MdFilterAlt
            size={20}
            style={{ marginRight: '5px' }}
          />
          {t('subscriptionFlow.filters')}
        </DarkTableCell>
      )}

      <DarkTableCell
        align="center"
        colSpan={userActionCount}
      >
        <MdCelebration
          size={20}
          style={{ marginRight: '5px' }}
        />
        {t('subscriptionFlow.subscriptionEvents')}
      </DarkTableCell>

      <DarkTableCell
        align="center"
        colSpan={nonUserActionCount}
      >
        <MdAlarmOn
          size={20}
          style={{ marginRight: '5px' }}
        />
        {t('subscriptionFlow.timeline')}
      </DarkTableCell>

      <PermissionControl
        qualifyingPermissions={[
          'CAN_UPDATE_SUBSCRIPTION_FLOW',
          'CAN_DELETE_SUBSCRIPTION_FLOW',
        ]}
      >
        <DarkTableCell align="center">
          {t('subscriptionFlow.actions')}
        </DarkTableCell>
      </PermissionControl>
    </>
  );
}
