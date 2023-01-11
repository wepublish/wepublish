import React, {useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {Table, Avatar} from 'rsuite'

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
import {useRecentActivityQuery, ActivityEvent, ActivityEventType} from '../../api'

export interface Event {
  date: string
  type: string
  id: string
  creator?: string
  summary?: string
}

export function ActivityFeed() {
  const {t, i18n} = useTranslation()

  const {data: activityEvents} = useRecentActivityQuery()
  const events = useMemo(() => activityEvents?.activityEvents, [activityEvents])
  console.log('events', events)

  return (
    <Table
      autoHeight
      rowHeight={60}
      width={600}
      // @ts-ignore
      data={events}>
      <Table.Column width={500}>
        <Table.HeaderCell>{t('dashboard.event')}</Table.HeaderCell>
        <Table.Cell width={300}>
          {(rowData: ActivityEvent) => {
            let icon = <></>
            let path = '/'
            let type = ''

            switch (rowData.eventType) {
              case ActivityEventType.Article:
                icon = <MdDescription />
                path = `/articles/edit/${rowData.id}`
                type = t('dashboard.newArticle')
                break
              case ActivityEventType.Page:
                icon = <MdDashboard />
                path = `/pages/edit/${rowData.id}`
                type = t('dashboard.newPage')
                break
              case ActivityEventType.Comment:
                icon = <MdChat />
                path = `/comments/edit/${rowData.id}`
                type = t('dashboard.newComment')
                break
              case ActivityEventType.Subscription:
                icon = <MdAutorenew />
                path = `/subscriptions/edit/${rowData.id}`
                type = t('dashboard.newSubscription')
                break
              case ActivityEventType.User:
                icon = <MdAccountCircle />
                path = `/users/edit/${rowData.id}`
                type = t('dashboard.newUser')
                break
              case ActivityEventType.Author:
                icon = <MdGroup />
                path = `/authors/edit/${rowData.id}`
                type = t('dashboard.newAuthor')
                break
              case ActivityEventType.Poll:
                icon = <MdOutlineGridView />
                path = `/polls/edit/${rowData.id}`
                type = t('dashboard.newPoll')
                break
              default:
                icon = <></>
            }
            return (
              <>
                <Avatar style={{marginRight: 12, backgroundColor: '#3498FF'}} circle>
                  {icon}
                </Avatar>
                <Link to={path}> {type} </Link>
                {formatDistanceToNow(new Date(rowData.date), {
                  locale: i18n.language === 'de' ? de : i18n.language === 'fr' ? fr : enUS,
                  addSuffix: true
                })}
                {rowData.creator && ` by ${rowData.creator}`}
              </>
            )
          }}
        </Table.Cell>
      </Table.Column>
      <Table.Column width={100}>
        <Table.HeaderCell>{t('dashboard.summary')}</Table.HeaderCell>
        <Table.Cell>
          {(rowData: Event) => {
            return <p style={{fontStyle: 'italic'}}>{rowData?.summary} </p>
          }}
        </Table.Cell>
      </Table.Column>
    </Table>
  )
}
