import React, {useState, useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {Table as RTable, Avatar} from 'rsuite'
import {RowDataType} from 'rsuite-table'
import {Link} from 'react-router-dom'
import {
  MdDescription,
  MdChat,
  MdAutorenew,
  MdAccountCircle,
  MdGroup,
  MdOutlineGridView,
  MdDashboard,
  MdEvent,
  MdFeed
} from 'react-icons/md'
import {formatDistanceToNow} from 'date-fns'
import styled from '@emotion/styled'
import {useRecentActionsQuery, Action, ActionType} from '@wepublish/editor/api'
import {AVAILABLE_LANG} from '../../base'
import {TableWrapper, Table} from '../../ui/listView'

export interface Event {
  date: string
  type: string
  id: string
  creator?: string
  summary?: string
}

const ActivityFeedSummaryText = styled.p`
  font-style: italic;
`

const ActivityFeedIcon = styled(Avatar)`
  background-color: #3498ff;
  margin-right: 4px;
`

const TableCellWithWordBreak = styled(RTable.Cell)`
  word-break: 'break-word';
`

const TableWordBreak = styled(Table)`
  word-break: 'break-word';
`

export function ActivityFeed() {
  const {t, i18n} = useTranslation()
  const {Column, HeaderCell, Cell} = RTable

  const {data, loading: isLoading} = useRecentActionsQuery()
  const [actions, setActions] = useState<Action[]>([])

  useEffect(() => {
    if (data?.actions) {
      setActions(data.actions)
    }
  }, [data?.actions])

  const mapDetailsToActionType = (rowData: RowDataType<Action>) => {
    switch (rowData.actionType) {
      case ActionType.Article:
        return {
          icon: <MdDescription />,
          path: `/articles/edit/${rowData.id}`,
          type: t('dashboard.newArticle')
        }
      case ActionType.Page:
        return {
          icon: <MdDashboard />,
          path: `/pages/edit/${rowData.id}`,
          type: t('dashboard.newPage')
        }
      case ActionType.Comment:
        return {
          icon: <MdChat />,
          path: `/comments/edit/${rowData.id}`,
          type: t('dashboard.newComment')
        }
      case ActionType.Subscription:
        return {
          icon: <MdAutorenew />,
          path: `/subscriptions/edit/${rowData.id}`,
          type: t('dashboard.newSubscription')
        }
      case ActionType.User:
        return {
          icon: <MdAccountCircle />,
          path: `/users/edit/${rowData.id}`,
          type: t('dashboard.newUser')
        }
      case ActionType.Author:
        return {
          icon: <MdGroup />,
          path: `/authors/edit/${rowData.id}`,
          type: t('dashboard.newAuthor')
        }
      case ActionType.Poll:
        return {
          icon: <MdOutlineGridView />,
          path: `/polls/edit/${rowData.id}`,
          type: t('dashboard.newPoll')
        }
      case ActionType.Event:
        return {
          icon: <MdEvent />,
          path: `/events/edit/${rowData.id}`,
          type: t('dashboard.newEvent')
        }
      default:
        return {
          icon: <MdFeed />,
          path: `/`,
          type: t('dashboard.newAction')
        }
    }
  }

  return (
    <TableWrapper>
      <TableWordBreak wordWrap data={actions} loading={isLoading}>
        <Column verticalAlign="bottom" flexGrow={2}>
          <HeaderCell dataKey="event">{t('dashboard.event')}</HeaderCell>
          <Cell dataKey="event">
            {(rowData: RowDataType<Action>) => {
              const action = mapDetailsToActionType(rowData)
              return (
                <>
                  <ActivityFeedIcon size="sm" circle>
                    {action.icon}
                  </ActivityFeedIcon>
                  <Link to={action.path}> {action.type} </Link>
                  {formatDistanceToNow(new Date(rowData.date), {
                    locale: AVAILABLE_LANG.find(lang => lang.id === i18n.language)?.locale,
                    addSuffix: true
                  })}
                  {rowData.creator && t('dashboard.createdBy', {creator: rowData.creator})}
                </>
              )
            }}
          </Cell>
        </Column>
        <Column verticalAlign="bottom" flexGrow={1}>
          <HeaderCell dataKey="summary">{t('dashboard.summary')}</HeaderCell>
          <TableCellWithWordBreak dataKey="summary">
            {(rowData: RowDataType<Action>) => {
              return (
                <>
                  <ActivityFeedSummaryText>{rowData?.summary} </ActivityFeedSummaryText>
                </>
              )
            }}
          </TableCellWithWordBreak>
        </Column>
      </TableWordBreak>
    </TableWrapper>
  )
}
