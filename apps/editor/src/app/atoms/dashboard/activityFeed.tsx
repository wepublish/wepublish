import styled from '@emotion/styled'
import {Action, ActionType, useRecentActionsQuery} from '@wepublish/editor/api'
import {formatDistanceToNow} from 'date-fns'
import {useEffect, useState, ReactNode} from 'react'
import {useTranslation, Trans} from 'react-i18next'
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
  const {t} = useTranslation()

  const {data, loading: isLoading} = useRecentActionsQuery({fetchPolicy: 'no-cache'})
  const [actions, setActions] = useState<Action[]>([])

  useEffect(() => {
    if (data?.actions) {
      setActions(data.actions)
    }
  }, [data?.actions])

  return (
    <>
      <Timeline>
        {actions.map((value, i) => {
          return (
            <TimelineItem
              key={i}
              dot={
                <TimelineIcon size="sm" circle>
                  {mapActionTypeToIcon(value.actionType)}
                </TimelineIcon>
              }>
              <TimelineDiv>
                <TimelineText action={value} />
              </TimelineDiv>
            </TimelineItem>
          )
        })}
      </Timeline>
    </>
  )
}

const TimelineText = ({action}: Action) => {
  const {i18n} = useTranslation()
  return (
    <>
      {mapDetailsToAction(action)}
      <p>
        {formatDistanceToNow(new Date(action.date), {
          locale: AVAILABLE_LANG.find(lang => lang.id === i18n.language)?.locale,
          addSuffix: true
        })}
      </p>
    </>
  )
}

function TranslatedCreateTitleWithLink({title, to}, key) {
  return (
    <Trans i18nKey={key} values={{title}}>
      New <Link to={to}>{`${title}`}</Link> has been created
    </Trans>
  )
}

export const mapDetailsToAction = (action: Action) => {
  const {t} = useTranslation()
  switch (action.actionType) {
    case ActionType.Article:
      return (
        <>
          <TranslatedCreateTitleWithLink
            key="dashboard.itemCreated"
            title={t('dashboard.newArticle')}
            to={`/articles/edit/${action.id}`}
          />
        </>
      )
    case ActionType.Page:
      return (
        <>
          <TranslatedCreateTitleWithLink
            key="dashboard.itemCreated"
            title={t('dashboard.newPage')}
            to={`/pages/edit/${action.id}`}
          />
        </>
      )
    case ActionType.Comment:
      return (
        <>
          <TranslatedCreateTitleWithLink
            key="dashboard.itemCreated"
            title={t('dashboard.newComment')}
            to={`/comments/edit/${action.id}`}
          />
          {action.creator && ' ' + t('dashboard.createdBy', {creator: action.creator})}
        </>
      )
    case ActionType.Subscription:
      return (
        <>
          <TranslatedCreateTitleWithLink
            title={t('dashboard.newSubscription')}
            key="dashboard.itemCreated"
            to={`/subscriptions/edit/${action.id}`}
          />
          {action.creator && ' ' + t('dashboard.createdBy', {creator: action.creator})}
          {action.summary && ' ' + t('dashboard.memberPlan', {plan: action.summary})}
        </>
      )
    case ActionType.User:
      return (
        <>
          <TranslatedCreateTitleWithLink
            key="dashboard.itemCreated"
            title={t('dashboard.newUser')}
            to={`/users/edit/${action.id}`}
          />
        </>
      )
    case ActionType.Author:
      return (
        <>
          <TranslatedCreateTitleWithLink
            key="dashboard.itemCreated"
            title={t('dashboard.newAuthor')}
            to={`/authors/edit/${action.id}`}
          />
        </>
      )
    case ActionType.Poll:
      return (
        <>
          <TranslatedCreateTitleWithLink
            key="dashboard.itemCreated"
            title={t('dashboard.newPoll')}
            to={`/polls/edit/${action.id}`}
          />
        </>
      )
    case ActionType.Event:
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

const mapActionTypeToIcon = (actionType: ActionType) => {
  switch (actionType) {
    case ActionType.Article:
      return <MdDescription />
    case ActionType.Page:
      return <MdDashboard />
    case ActionType.Comment:
      return <MdChat />
    case ActionType.Subscription:
      return <MdAutorenew />
    case ActionType.User:
      return <MdAccountCircle />
    case ActionType.Author:
      return <MdGroup />
    case ActionType.Poll:
      return <MdOutlineGridView />
    case ActionType.Event:
      return <MdEvent />
    default:
      return <MdDescription />
  }
}
