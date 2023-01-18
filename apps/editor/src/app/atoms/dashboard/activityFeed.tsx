import React, {useState, useEffect} from 'react'
import {useTranslation} from 'react-i18next'
import {Table, Avatar} from 'rsuite'
import {RowDataType} from 'rsuite-table'
import {Link} from 'react-router-dom'
import {
  MdDescription,
  MdChat,
  MdAutorenew,
  MdAccountCircle,
  MdGroup,
  MdOutlineGridView,
  MdDashboard
} from 'react-icons/md'
import {formatDistanceToNow} from 'date-fns'
import {fr, de, enUS} from 'date-fns/locale'
import styled from '@emotion/styled'
import {useRecentActionsQuery, Action, ActionType} from '@wepublish/editor/api'

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
  margin-right: 1rem;
  background-color: #3498ff;
`

export function ActivityFeed() {
  const {t, i18n} = useTranslation()
  const {Column, HeaderCell, Cell} = Table

  const {data, loading: isLoading} = useRecentActionsQuery()
  const [actions, setActions] = useState<Action[]>([])

  useEffect(() => {
    if (data?.actions) {
      setActions(data.actions)
    }
  }, [data?.actions])

  return (
    <Table wordWrap autoHeight rowHeight={60} data={actions} loading={isLoading}>
      <Column flexGrow={2}>
        <HeaderCell dataKey="event">{t('dashboard.event')}</HeaderCell>
        <Cell dataKey="event">
          {(rowData: RowDataType<Action>) => {
            let icon = <></>
            let path = '/'
            let type = ''

            switch (rowData.actionType) {
              case ActionType.Article:
                icon = <MdDescription />
                path = `/articles/edit/${rowData.id}`
                type = t('dashboard.newArticle')
                break
              case ActionType.Page:
                icon = <MdDashboard />
                path = `/pages/edit/${rowData.id}`
                type = t('dashboard.newPage')
                break
              case ActionType.Comment:
                icon = <MdChat />
                path = `/comments/edit/${rowData.id}`
                type = t('dashboard.newComment')
                break
              case ActionType.Subscription:
                icon = <MdAutorenew />
                path = `/subscriptions/edit/${rowData.id}`
                type = t('dashboard.newSubscription')
                break
              case ActionType.User:
                icon = <MdAccountCircle />
                path = `/users/edit/${rowData.id}`
                type = t('dashboard.newUser')
                break
              case ActionType.Author:
                icon = <MdGroup />
                path = `/authors/edit/${rowData.id}`
                type = t('dashboard.newAuthor')
                break
              case ActionType.Poll:
                icon = <MdOutlineGridView />
                path = `/polls/edit/${rowData.id}`
                type = t('dashboard.newPoll')
                break
              default:
                icon = <></>
            }
            return (
              <>
                <ActivityFeedIcon circle>{icon}</ActivityFeedIcon>
                <Link to={path}> {type} </Link>
                {formatDistanceToNow(new Date(rowData.date), {
                  locale: i18n.language === 'de' ? de : i18n.language === 'fr' ? fr : enUS,
                  addSuffix: true
                })}
                {rowData.creator && t('dashboard.createdBy', {creator: rowData.creator})}
              </>
            )
          }}
        </Cell>
      </Column>
      <Column flexGrow={1}>
        <HeaderCell dataKey="summary">{t('dashboard.summary')}</HeaderCell>
        <Cell dataKey="summary">
          {(rowData: RowDataType<Action>) => {
            return <ActivityFeedSummaryText>{rowData?.summary} </ActivityFeedSummaryText>
          }}
        </Cell>
      </Column>
    </Table>
  )
}
