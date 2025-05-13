import {DailySubscriptionStats} from '@wepublish/editor/api-v2'
import {useTranslation} from 'react-i18next'
import Table, {RowDataType} from 'rsuite/esm/Table'

import {AudienceClientFilter, AudienceStatsComputed} from './audience-dashboard'

const {Column, HeaderCell, Cell} = Table

interface AudienceTableProps {
  audienceStats: AudienceStatsComputed[]
  clientFilter: AudienceClientFilter
}

export function AudienceTable({audienceStats, clientFilter}: AudienceTableProps) {
  const {t} = useTranslation()

  const {
    totalActiveSubscriptionCount,
    createdSubscriptionCount,
    renewedSubscriptionCount,
    createdUnpaidSubscriptionCount,
    replacedSubscriptionCount,
    deactivatedSubscriptionCount
  } = clientFilter

  return (
    <Table data={audienceStats} style={{width: '100%'}} autoHeight>
      <Column resizable width={150}>
        <HeaderCell>{t('audienceTable.header.date')}</HeaderCell>
        <Cell dataKey="date">
          {(rowData: RowDataType<DailySubscriptionStats>) => (
            <>{new Date(rowData.date).toLocaleDateString('de', {dateStyle: 'medium'})}</>
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
          {(rowData: RowDataType<AudienceStatsComputed>) => <b>{rowData.totalNewSubscriptions}</b>}
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
          {(rowData: RowDataType<any>) => <>{rowData.renewalRate}%</>}
        </Cell>
      </Column>
      <Column resizable width={150}>
        <HeaderCell>{'Kündigungsrate'}</HeaderCell>
        <Cell dataKey="cancellationRate">
          {(rowData: RowDataType<any>) => <>{rowData.cancellationRate}%</>}
        </Cell>
      </Column>
    </Table>
  )
}
