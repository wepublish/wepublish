import Table, {RowDataType} from 'rsuite/esm/Table'

import {AudienceStat} from './audience-data-mocker'

const {Column, HeaderCell, Cell} = Table

interface AudienceTableProps {
  audienceStats: AudienceStat[]
}

export function AudienceTable({audienceStats}: AudienceTableProps) {
  return (
    <Table data={audienceStats} style={{width: '100%'}}>
      <Column resizable>
        <HeaderCell>{'Monat'}</HeaderCell>
        <Cell dataKey="date" />
      </Column>
      <Column resizable width={150}>
        <HeaderCell>{'Laufende Abos'}</HeaderCell>
        <Cell dataKey="ongoingSubscriptions" />
      </Column>
      <Column resizable>
        <HeaderCell>{'Erneuerungen'}</HeaderCell>
        <Cell dataKey="renewedSubscriptions" />
      </Column>
      <Column resizable width={100}>
        <HeaderCell>{'Neue Abos'}</HeaderCell>
        <Cell dataKey="newSubscriptions" />
      </Column>
      <Column resizable>
        <HeaderCell>{'Kündigungen'}</HeaderCell>
        <Cell dataKey="cancelledSubscriptions" />
      </Column>
      <Column resizable width={150}>
        <HeaderCell>{'Total aktive Abos'}</HeaderCell>
        <Cell dataKey="totalActiveSubscriptions">
          {(rowData: RowDataType<AudienceStat>) => <b>{rowData.totalActiveSubscriptions}</b>}
        </Cell>
      </Column>
      <Column resizable width={150}>
        <HeaderCell>{'Erneuerungsrate'}</HeaderCell>
        <Cell dataKey="renewalRate">
          {(rowData: RowDataType<AudienceStat>) => <>{rowData.renewalRate}%</>}
        </Cell>
      </Column>
      <Column resizable width={150}>
        <HeaderCell>{'Kündigungsrate'}</HeaderCell>
        <Cell dataKey="cancellationRate">
          {(rowData: RowDataType<AudienceStat>) => <>{rowData.cancellationRate}%</>}
        </Cell>
      </Column>
    </Table>
  )
}
