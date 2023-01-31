import styled from '@emotion/styled'
import {Action, ActionType, useRecentActionsQuery} from '@wepublish/editor/api'
import {formatDistanceToNow} from 'date-fns'
import {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {
  MdAccountCircle,
  MdAutorenew,
  MdChat,
  MdDashboard,
  MdDescription,
  MdEvent,
  MdFeed,
  MdGroup,
  MdOutlineGridView,
  MdEdit
} from 'react-icons/md'
import {Link} from 'react-router-dom'
import {Avatar, Timeline as RTimeline} from 'rsuite'

import {AVAILABLE_LANG} from '../../base'

export interface Event {
  date: string
  type: string
  id: string
  creator?: string
  summary?: string
}

const SummaryText = styled.p`
  font-style: italic;
`

const Timeline = styled(RTimeline)`
  margin-left: 10px;
`

const TimelineItem = styled(RTimeline.Item)`
  margin-left: '20px';
`

const TimelineDiv = styled.div`
  margin-left: 10px;
  margin-bottom: 10px;
`

const TimelineIcon = styled(Avatar)`
  background: #fff;
  top: 0;
  left: -2px;
  border: 2px solid #3498ff;
  border-radius: 50%;
  color: #3498ff;
  margin-left: -8px;
  margin-top: -8px;
  padding: 4px;
`

export function ActivityFeed() {
  const {t, i18n} = useTranslation()

  const {data, loading: isLoading} = useRecentActionsQuery({fetchPolicy: 'no-cache'})
  const [actions, setActions] = useState<Action[]>([])

  useEffect(() => {
    if (data?.actions) {
      setActions(data.actions)
    }
  }, [data?.actions])

  const mapDetailsToAction = (action: Action) => {
    switch (action.actionType) {
      case ActionType.Article:
        return {
          icon: <MdDescription />,
          path: `/articles/edit/${action.id}`,
          type: t('dashboard.newArticle')
        }
      case ActionType.Page:
        return {
          icon: <MdDashboard />,
          path: `/pages/edit/${action.id}`,
          type: t('dashboard.newPage')
        }
      case ActionType.Comment:
        return {
          icon: <MdChat />,
          path: `/comments/edit/${action.id}`,
          type: t('dashboard.newComment')
        }
      case ActionType.Subscription:
        return {
          icon: <MdAutorenew />,
          path: `/subscriptions/edit/${action.id}`,
          type: t('dashboard.newSubscription')
        }
      case ActionType.User:
        return {
          icon: <MdAccountCircle />,
          path: `/users/edit/${action.id}`,
          type: t('dashboard.newUser')
        }
      case ActionType.Author:
        return {
          icon: <MdGroup />,
          path: `/authors/edit/${action.id}`,
          type: t('dashboard.newAuthor')
        }
      case ActionType.Poll:
        return {
          icon: <MdOutlineGridView />,
          path: `/polls/edit/${action.id}`,
          type: t('dashboard.newPoll')
        }
      case ActionType.Event:
        return {
          icon: <MdEvent />,
          path: `/events/edit/${action.id}`,
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
    <>
      <Timeline>
        {actions.map(value => {
          const action = mapDetailsToAction(value)
          return (
            <TimelineItem
              dot={
                <TimelineIcon size="sm" circle>
                  {action.icon}
                </TimelineIcon>
              }>
              <TimelineDiv>
                <p>
                  {action.type +
                    ' ' +
                    formatDistanceToNow(new Date(value.date), {
                      locale: AVAILABLE_LANG.find(lang => lang.id === i18n.language)?.locale,
                      addSuffix: true
                    })}{' '}
                  <Link to={action.path}>
                    <MdEdit />
                  </Link>
                </p>
                {value.creator && <p>{t('dashboard.createdBy', {creator: value.creator})}</p>}
                {value.summary && <SummaryText>{value.summary}</SummaryText>}
              </TimelineDiv>
            </TimelineItem>
          )
        })}
      </Timeline>
    </>
  )
}
