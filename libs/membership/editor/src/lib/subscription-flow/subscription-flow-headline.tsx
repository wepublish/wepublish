import { MdAlarmOn, MdCelebration, MdFilterAlt } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { PermissionControl } from '@wepublish/ui/editor';
import { SectionBandCell } from '../mail-settings-layout';

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
        <SectionBandCell
          colSpan={filterCount}
          label={t('subscriptionFlow.filters')}
          icon={<MdFilterAlt size={20} />}
          description={t('subscriptionFlow.filtersDescription')}
          example={t('subscriptionFlow.filtersExample')}
        />
      )}

      <SectionBandCell
        colSpan={userActionCount}
        label={t('subscriptionFlow.subscriptionEvents')}
        icon={<MdCelebration size={20} />}
        description={t('subscriptionFlow.subscriptionEventsDescription')}
        example={t('subscriptionFlow.subscriptionEventsExample')}
      />

      <SectionBandCell
        colSpan={nonUserActionCount}
        label={t('subscriptionFlow.timeline')}
        icon={<MdAlarmOn size={20} />}
        description={t('subscriptionFlow.timelineDescription')}
        example={t('subscriptionFlow.timelineExample')}
      />

      <PermissionControl
        qualifyingPermissions={[
          'CAN_UPDATE_SUBSCRIPTION_FLOW',
          'CAN_DELETE_SUBSCRIPTION_FLOW',
        ]}
      >
        <SectionBandCell
          label={t('subscriptionFlow.actions')}
          description={t('subscriptionFlow.actionsDescription')}
          example={t('subscriptionFlow.actionsExample')}
        />
      </PermissionControl>
    </>
  );
}
