import styled from '@emotion/styled'
import {Action, ActionType, useRecentActionsQuery} from '@wepublish/editor/api'
import {formatDistanceToNow} from 'date-fns'
import {useEffect, useState} from 'react'
import {useTranslation, Trans} from 'react-i18next'
import {
  MdAccountCircle,
  MdAutorenew,
  MdChat,
  MdDashboard,
  MdDescription,
  MdEvent,
  MdGroup,
  MdOutlineGridView
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
  const {t} = useTranslation()

  const {data, loading: isLoading} = useRecentActionsQuery({fetchPolicy: 'no-cache'})
  const [actions, setActions] = useState<Action[]>([])

  useEffect(() => {
    console.log('data', data?.actions[0])
    if (data?.actions) {
      setActions(data.actions)
    }
  }, [data])

  return (
    <>
      <Timeline>
        {actions.map((action, i) => {
          return (
            <TimelineItem
              key={i}
              dot={
                <TimelineIcon size="sm" circle>
                  {MapActionTypeToIcon(action.actionType)}
                </TimelineIcon>
              }>
              <TimelineDiv>
                <TimelineText action={action} />
              </TimelineDiv>
            </TimelineItem>
          )
        })}
      </Timeline>
    </>
  )
}

const TimelineText = ({action}: any) => {
  const {i18n} = useTranslation()
  return (
    <>
      {MapDetailsToAction(action)}
      <p>
        {formatDistanceToNow(new Date(action.date), {
          locale: AVAILABLE_LANG.find(lang => lang.id === i18n.language)?.locale,
          addSuffix: true
        })}
      </p>
    </>
  )
}

function TranslatedCreateTitleWithLink(props: {title: string; to: string}, key: string) {
  const {title, to} = props
  return (
    <Trans i18nKey={key} values={{title}}>
      New <Link to={to}>{`${title}`}</Link> has been created
    </Trans>
  )
}

function TranslatedOpenTitleWithLink(props: {title: string; to: string}, key: string) {
  const {title, to} = props
  return (
    <Trans i18nKey={key} values={{title}}>
      New <Link to={to}>{`${title}`}</Link> opened
    </Trans>
  )
}

export const MapDetailsToAction = (action: Action) => {
  const {t} = useTranslation()

  switch (action.actionType) {
    case ActionType.ArticleCreate:
      return (
        <>
          <TranslatedCreateTitleWithLink
            key="dashboard.itemCreated"
            title={t('dashboard.newArticle')}
            to={`/articles/edit/${action.id}`}
          />
        </>
      )
    case ActionType.PageCreate:
      return (
        <>
          <TranslatedCreateTitleWithLink
            key="dashboard.itemCreated"
            title={t('dashboard.newPage')}
            to={`/pages/edit/${action.id}`}
          />
        </>
      )
    case ActionType.CommentCreate:
      return (
        <>
          <TranslatedCreateTitleWithLink
            key="dashboard.itemCreated"
            title={t('dashboard.newComment')}
            to={`/comments/edit/${action.id}`}
          />
        </>
      )
    case ActionType.SubscriptionCreate:
      return (
        <>
          <TranslatedCreateTitleWithLink
            title={t('dashboard.newSubscription')}
            key="dashboard.itemCreated"
            to={`/subscriptions/edit/${action.id}`}
          />
        </>
      )
    case ActionType.UserCreate:
      return (
        <>
          <TranslatedCreateTitleWithLink
            key="dashboard.itemCreated"
            title={t('dashboard.newUser')}
            to={`/users/edit/${action.id}`}
          />
        </>
      )
    case ActionType.AuthorCreate:
      return (
        <>
          <TranslatedCreateTitleWithLink
            key="dashboard.itemCreated"
            title={t('dashboard.newAuthor')}
            to={`/authors/edit/${action.id}`}
          />
        </>
      )
    case ActionType.PollStart:
      return (
        <>
          <TranslatedOpenTitleWithLink
            key="dashboard.itemCreated"
            title={t('dashboard.newPoll')}
            to={`/polls/edit/${action.id}`}
          />
        </>
      )
    case ActionType.EventCreate:
      return (
        <>
          <TranslatedCreateTitleWithLink
            key="dashboard.itemCreated"
            title={t('dashboard.newEvent')}
            to={`/events/edit/${action.id}`}
          />
        </>
      )
    default:
      return (
        <TranslatedCreateTitleWithLink
          key="dashboard.itemCreated"
          title={t('dashboard.newAction')}
          to={'/'}
        />
      )
  }
}

const MapActionTypeToIcon = (actionType: ActionType) => {
  switch (actionType) {
    case ActionType.ArticleCreate:
      return <MdDescription />
    case ActionType.PageCreate:
      return <MdDashboard />
    case ActionType.CommentCreate:
      return <MdChat />
    case ActionType.SubscriptionCreate:
      return <MdAutorenew />
    case ActionType.UserCreate:
      return <MdAccountCircle />
    case ActionType.AuthorCreate:
      return <MdGroup />
    case ActionType.PollStart:
      return <MdOutlineGridView />
    case ActionType.EventCreate:
      return <MdEvent />
    default:
      return <MdDescription />
  }
}
