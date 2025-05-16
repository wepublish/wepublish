import ListIcon from '@rsuite/icons/List'
import {DailySubscriptionStats} from '@wepublish/editor/api-v2'
import {useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button} from 'rsuite'
import Table, {RowDataType} from 'rsuite/esm/Table'

import {AudienceClientFilter, TimeResolution} from './audience-dashboard'
import {AudienceDetailDrawer} from './audience-detail-drawer'
import {AudienceStatsComputed} from './useAudience'

const {Column, HeaderCell, Cell} = Table

interface AudienceTableProps {
  audienceStats: AudienceStatsComputed[]
  clientFilter: AudienceClientFilter
  timeResolution: TimeResolution
}

export function AudienceTable({audienceStats, clientFilter, timeResolution}: AudienceTableProps) {
  const {t} = useTranslation()

  const {
    totalActiveSubscriptionCount,
    createdSubscriptionCount,
    renewedSubscriptionCount,
    createdUnpaidSubscriptionCount,
    replacedSubscriptionCount,
    deactivatedSubscriptionCount
  } = clientFilter

  const [selectedAudienceStats, setSelectedAudienceStats] = useState<
    AudienceStatsComputed | undefined
  >(undefined)

  return (
    <>
      <Table data={audienceStats} style={{width: '100%'}} virtualized height={800}>
        <Column resizable width={160}>
          <HeaderCell>{t('audienceTable.header.date')}</HeaderCell>
          <Cell dataKey="date">
            {(rowData: RowDataType<DailySubscriptionStats>) => (
              <>
                {timeResolution === 'monthly' && <span>{t('audienceTable.byDate')}</span>}{' '}
                {new Date(rowData.date).toLocaleDateString('de', {dateStyle: 'medium'})}
              </>
            )}
          </Cell>
        </Column>

        {replacedSubscriptionCount && (
          <Column resizable>
            <HeaderCell>{t('audienceTable.header.replacedSubscriptionCount')}</HeaderCell>
            <Cell dataKey="replacedSubscriptionCount" />
          </Column>
        )}

        {createdSubscriptionCount && (
          <Column resizable>
            <HeaderCell>{t('audienceTable.header.createdSubscriptionCount')}</HeaderCell>
            <Cell dataKey="createdSubscriptionCount" />
          </Column>
        )}

        {createdUnpaidSubscriptionCount && (
          <Column resizable width={100}>
            <HeaderCell>{t('audienceTable.header.createdUnpaidSubscriptionCount')}</HeaderCell>
            <Cell dataKey="createdUnpaidSubscriptionCount" />
          </Column>
        )}

        {renewedSubscriptionCount && (
          <Column resizable>
            <HeaderCell>{t('audienceTable.header.renewedSubscriptionCount')}</HeaderCell>
            <Cell dataKey="renewedSubscriptionCount" />
          </Column>
        )}

        <Column resizable>
          <HeaderCell>{t('audienceTable.header.totalNewSubscriptions')}</HeaderCell>
          <Cell dataKey="totalNewSubscriptions">
            {(rowData: RowDataType<AudienceStatsComputed>) => (
              <b>{rowData.totalNewSubscriptions}</b>
            )}
          </Cell>
        </Column>

        {deactivatedSubscriptionCount && (
          <Column resizable>
            <HeaderCell>{t('audienceTable.header.deactivatedSubscriptionCount')}</HeaderCell>
            <Cell dataKey="deactivatedSubscriptionCount" />
          </Column>
        )}

        {totalActiveSubscriptionCount && (
          <Column resizable>
            <HeaderCell>{t('audienceTable.header.totalActiveSubscriptionCount')}</HeaderCell>
            <Cell dataKey="totalActiveSubscriptionCount" />
          </Column>
        )}
        <Column resizable width={150}>
          <HeaderCell>{t('audienceTable.header.totalActiveSubscriptionCount')}</HeaderCell>
          <Cell dataKey="renewalRate">
            {(rowData: RowDataType<AudienceStatsComputed>) => (
              <>
                <span>
                  ({rowData.renewedAndReplaced} / {rowData.totalToBeRenewed})
                </span>{' '}
                <b>{rowData.renewalRate}%</b>
              </>
            )}
          </Cell>
        </Column>
        <Column resizable width={150}>
          <HeaderCell>{t('audienceTable.header.cancellationRate')}</HeaderCell>
          <Cell dataKey="cancellationRate">
            {(rowData: RowDataType<AudienceStatsComputed>) => (
              <>
                <span>
                  ({rowData.deactivatedSubscriptionCount * -1} / {rowData.totalToBeRenewed})
                </span>{' '}
                <b>{rowData.cancellationRate}%</b>
              </>
            )}
          </Cell>
        </Column>
        <Column width={180}>
          <HeaderCell>{t('audienceTable.header.details')}</HeaderCell>
          <Cell dataKey="action">
            {(rowData: RowDataType<AudienceStatsComputed>) => (
              <Button
                size="xs"
                appearance="primary"
                startIcon={<ListIcon />}
                onClick={() => setSelectedAudienceStats(rowData as AudienceStatsComputed)}>
                {t('audienceTable.showUsers')}
              </Button>
            )}
          </Cell>
        </Column>
      </Table>

      <AudienceDetailDrawer
        audienceStats={selectedAudienceStats}
        setOpen={setSelectedAudienceStats}
        timeResolution={timeResolution}
      />
    </>
  )
}
