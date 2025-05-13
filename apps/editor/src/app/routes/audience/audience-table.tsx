import {DailySubscriptionStats, DailySubscriptionStatsQuery} from '@wepublish/editor/api-v2'
import {useTranslation} from 'react-i18next'
import Table, {RowDataType} from 'rsuite/esm/Table'

const {Column, HeaderCell, Cell} = Table

interface AudienceTableProps {
  audienceStats: DailySubscriptionStatsQuery | undefined
}

export function AudienceTable({audienceStats}: AudienceTableProps) {
  const {t} = useTranslation()

  return (
    <Table data={audienceStats?.dailySubscriptionStats} style={{width: '100%'}} autoHeight>
      <Column resizable width={150}>
        <HeaderCell>{t('audienceTable.header.date')}</HeaderCell>
        <Cell dataKey="date">
          {(rowData: RowDataType<DailySubscriptionStats>) => (
            <>{new Date(rowData.date).toLocaleDateString('de', {dateStyle: 'medium'})}</>
          )}
        </Cell>
      </Column>
      <Column resizable>
        <HeaderCell>{t('audienceTable.header.replacedSubscriptionCount')}</HeaderCell>
        <Cell dataKey="replacedSubscriptionCount" />
      </Column>
      <Column resizable>
        <HeaderCell>{t('audienceTable.header.createdSubscriptionCount')}</HeaderCell>
        <Cell dataKey="createdSubscriptionCount" />
      </Column>
      <Column resizable width={100}>
        <HeaderCell>{t('audienceTable.header.createdUnpaidSubscriptionCount')}</HeaderCell>
        <Cell dataKey="createdUnpaidSubscriptionCount" />
      </Column>
      <Column resizable>
        <HeaderCell>{t('audienceTable.header.renewedSubscriptionCount')}</HeaderCell>
        <Cell dataKey="renewedSubscriptionCount" />
      </Column>
      <Column resizable>
        <HeaderCell>{t('audienceTable.header.deactivatedSubscriptionCount')}</HeaderCell>
        <Cell dataKey="deactivatedSubscriptionCount" />
      </Column>
      <Column resizable>
        <HeaderCell>{t('audienceTable.header.totalActiveSubscriptionCount')}</HeaderCell>
        <Cell dataKey="totalActiveSubscriptionCount" />
      </Column>
      <Column resizable width={150}>
        <HeaderCell>{'Erneuerungsrate'}</HeaderCell>
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
