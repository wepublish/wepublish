import styled from '@emotion/styled'
import {RecentActionsQuery, useRecentActionsQuery} from '@wepublish/editor/api'
import {formatDistanceToNow} from 'date-fns'
import {ReactNode, useEffect, useState} from 'react'
import {Trans, useTranslation} from 'react-i18next'
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
import {Avatar, Message, Timeline as RTimeline, toaster} from 'rsuite'

import {AVAILABLE_LANG} from '../../base'
import {RichTextBlock} from '../../blocks/richTextBlock/richTextBlock'

const Timeline = styled(RTimeline)`
  margin-left: 10px;
`

const TimelineItem = styled(RTimeline.Item)`
  margin-left: '20px';
`

const TimelineItemWrapper = styled.div`
  margin-left: 10px;
  margin-bottom: 10px;
`

const TimelineRichTextWrapper = styled.div`
  font-style: italic;
  color: gray;
  margin-left: 30px;
`

const ActionDetails = styled.p`
  font-style: italic;
  padding-top: 2px;
  color: gray;
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

type Action = NonNullable<RecentActionsQuery['actions']>[number]

export function ActivityFeed() {
  const {data, error} = useRecentActionsQuery({fetchPolicy: 'no-cache'})
  const [actions, setActions] = useState<Action[] | undefined>([])

  useEffect(() => {
    console.log('data', data)
    if (data?.actions) {
      const {actions} = data
      setActions(actions)
    }
  }, [data?.actions])

  useEffect(() => {
    if (error)
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {error.message}
        </Message>
      )
  }, [error])

  return (
    <Timeline>
      {actions?.map((action: Action, i) => {
        return (
          <TimelineItem
            key={i}
            dot={
              <TimelineIcon size="sm" circle>
                {MapActionTypeToIcon(action.__typename)}
              </TimelineIcon>
            }>
            <TimelineItemWrapper>
              <TimelineItemDetails action={action} />
            </TimelineItemWrapper>
          </TimelineItem>
        )
      })}
    </Timeline>
  )
}

function RelativeTimeToNow(time: string) {
  const {i18n} = useTranslation()

  return formatDistanceToNow(new Date(time), {
    locale: AVAILABLE_LANG.find(lang => lang.id === i18n.language)?.locale,
    addSuffix: true
  })
}

export type Props = {
  action: Action
}

function TimelineItemDetails(props: Props) {
  const {action} = props
  const {t} = useTranslation()

  if (!action) {
    return <></>
  }

  switch (action.__typename) {
    case 'ArticleCreatedAction':
      return (
        <ItemCreatedTimelineItem
          title={t('dashboard.newArticle')}
          link={`/articles/edit/${action.article.id}`}
          date={action.date}>
          <ActionDetails>
            {action.article.latest?.title ?? t('articles.overview.untitled')}
          </ActionDetails>
        </ItemCreatedTimelineItem>
      )
    case 'PageCreatedAction':
      return (
        <ItemCreatedTimelineItem
          title={t('dashboard.newPage')}
          link={`/pages/edit/${action.page.id}`}
          date={action.date}>
          <ActionDetails>
            {action.page.latest.title ??
              action.page.latest.socialMediaTitle ??
              t('pages.overview.untitled')}
          </ActionDetails>
        </ItemCreatedTimelineItem>
      )
    case 'CommentCreatedAction':
      return (
        <ItemCreatedTimelineItem
          date={action.date}
          link={`/comments/edit/${action.comment.id}`}
          title={t('dashboard.newComment')}>
          <>
            <ActionDetails>
              {`${action.comment.user?.name ?? action.comment.guestUsername ?? ''} ${
                action.comment.revisions[action.comment.revisions.length - 1]?.title
                  ? ': ' + action.comment.revisions[action.comment.revisions?.length - 1]?.title
                  : ''
              }`}
            </ActionDetails>
            <TimelineRichTextWrapper>
              <RichTextBlock
                displayOnly
                displayOneLine
                disabled
                onChange={() => {
                  return undefined
                }}
                value={action.comment.revisions[action.comment.revisions?.length - 1]?.text || []}
              />
            </TimelineRichTextWrapper>
          </>
        </ItemCreatedTimelineItem>
      )
    case 'SubscriptionCreatedAction':
      return (
        <ItemCreatedTimelineItem
          date={action.date}
          link={`/subscriptions/edit/${action.subscription.id}`}
          title={t('dashboard.newSubscription')}>
          <ActionDetails>
            {action.subscription.memberPlan.name}: {action.subscription.user?.email}
          </ActionDetails>
        </ItemCreatedTimelineItem>
      )
    case 'UserCreatedAction':
      // TODO add user id and link
      return (
        <ItemCreatedTimelineItem date={action.date} link={''} title={t('dashboard.newUser')}>
          <ActionDetails>
            {`${action.user.firstName ? action.user.firstName + ' ' : ''}${action.user.name}${
              action.user.address?.city ? ', ' + action.user.address?.city : ''
            }`}
          </ActionDetails>
        </ItemCreatedTimelineItem>
      )
    case 'AuthorCreatedAction':
      return (
        <ItemCreatedTimelineItem
          date={action.date}
          link={`/authors/edit/${action.author.id}`}
          title={t('dashboard.newAuthor')}>
          <ActionDetails>
            {action.author.name}
            {action.author.jobTitle ? ', ' + action.author.jobTitle : ''}
          </ActionDetails>
        </ItemCreatedTimelineItem>
      )
    case 'PollStartedAction':
      return (
        <ItemOpenedTimelineItem
          date={action.date}
          link={`/polls/edit/${action.poll.id}`}
          title={t('dashboard.newPoll')}>
          <ActionDetails>{action.poll.question}</ActionDetails>
        </ItemOpenedTimelineItem>
      )
    case 'EventCreatedAction':
      return (
        <ItemCreatedTimelineItem
          date={action.date}
          link={`/events/edit/${action.event.id}`}
          title={t('dashboard.newEvent')}>
          <>
            <ActionDetails>{action.event.name}</ActionDetails>
            <ActionDetails>{action.event.location}</ActionDetails>
          </>
        </ItemCreatedTimelineItem>
      )
    default:
      return <></>
  }
}

const MapActionTypeToIcon = (actionType: Action['__typename']) => {
  switch (actionType) {
    case 'ArticleCreatedAction':
      return <MdDescription />
    case 'PageCreatedAction':
      return <MdDashboard />
    case 'CommentCreatedAction':
      return <MdChat />
    case 'SubscriptionCreatedAction':
      return <MdAutorenew />
    case 'UserCreatedAction':
      return <MdAccountCircle />
    case 'AuthorCreatedAction':
      return <MdGroup />
    case 'PollStartedAction':
      return <MdOutlineGridView />
    case 'EventCreatedAction':
      return <MdEvent />
    default:
      return <MdDescription />
  }
}

function ItemCreatedTimelineItem(props: {
  date: string
  link: string
  title: string
  children: ReactNode
}) {
  const {date, children, title, link} = props
  const {t} = useTranslation()

  return (
    <Trans i18nKey={t('dashboard.itemCreated')} values={title}>
      New <Link to={link}>{`${title}`}</Link> has been created
      <p>{RelativeTimeToNow(date)}</p>
      {children}
    </Trans>
  )
}

function ItemOpenedTimelineItem(props: {
  date: string
  link: string
  title: string
  children: ReactNode
}) {
  const {date, children, title, link} = props
  const {t} = useTranslation()

  return (
    <Trans i18nKey={t('dashboard.itemOpened')} values={title}>
      New <Link to={link}>{`${title}`}</Link> opened
      <p>{RelativeTimeToNow(date)}</p>
      {children}
    </Trans>
  )
}
