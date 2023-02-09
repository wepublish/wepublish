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
  MdGroup,
  MdOutlineGridView
} from 'react-icons/md'
import {Link} from 'react-router-dom'
import {Avatar, Timeline as RTimeline, Message, toaster} from 'rsuite'

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

export function ActivityFeed() {
  const {data, error} = useRecentActionsQuery({fetchPolicy: 'no-cache'})
  const [actions, setActions] = useState<Action[] | undefined>([])

  useEffect(() => {
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
    <>
      <Timeline>
        {actions?.map((action: Action, i) => {
          return (
            <TimelineItem
              key={i}
              dot={
                <TimelineIcon size="sm" circle>
                  {MapActionTypeToIcon(action.actionType)}
                </TimelineIcon>
              }>
              <TimelineItemWrapper>
                <TimelineItemDetails date={action.date} id={action.id} item={action.item} />
              </TimelineItemWrapper>
            </TimelineItem>
          )
        })}
      </Timeline>
    </>
  )
}

function RelativeTimeToNow(time: string) {
  const {i18n} = useTranslation()

  return formatDistanceToNow(new Date(time), {
    locale: AVAILABLE_LANG.find(lang => lang.id === i18n.language)?.locale,
    addSuffix: true
  })
}

function TimelineItemDetails({date, item, id}: Omit<Action, 'actionType'>) {
  const {t} = useTranslation()

  switch (item?.__typename) {
    case 'ArticleAction':
      return (
        <ItemCreatedTimelineItem
          title={t('dashboard.newArticle')}
          link={`/articles/edit/${id ?? ''}`}
          date={date}>
          <ActionDetails>
            {item.article?.latest?.title ?? t('articles.overview.untitled')}
          </ActionDetails>
        </ItemCreatedTimelineItem>
      )
    case 'PageAction':
      return (
        <ItemCreatedTimelineItem
          title={t('dashboard.newPage')}
          link={`/pages/edit/${item?.page?.id ?? ''}`}
          date={date}>
          <ActionDetails>
            {item.page?.latest?.title ??
              item.page?.latest?.socialMediaTitle ??
              t('pages.overview.untitled')}
          </ActionDetails>
        </ItemCreatedTimelineItem>
      )
    case 'CommentAction':
      return (
        <ItemCreatedTimelineItem
          date={date}
          link={`/comments/edit/${id}`}
          title={t('dashboard.newComment')}>
          <>
            <ActionDetails>
              {`${item.comment?.user?.name ?? item.comment?.guestUsername ?? ''} ${
                item.comment?.revisions[item.comment?.revisions?.length - 1]?.title
                  ? ': ' + item.comment?.revisions[item.comment?.revisions?.length - 1]?.title
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
                value={item.comment?.revisions[item.comment?.revisions?.length - 1]?.text || []}
              />
            </TimelineRichTextWrapper>
          </>
        </ItemCreatedTimelineItem>
      )
    case 'SubscriptionAction':
      return (
        <ItemCreatedTimelineItem
          date={date}
          link={`/subscriptions/edit/${id}`}
          title={t('dashboard.newSubscription')}>
          <ActionDetails>
            {item.subscription?.memberPlan.name}: {item.subscription?.user?.email}
          </ActionDetails>
        </ItemCreatedTimelineItem>
      )
    case 'UserAction':
      return (
        <ItemCreatedTimelineItem
          date={date}
          link={`/users/edit/${id}`}
          title={t('dashboard.newUser')}>
          <ActionDetails>
            {`${item.user?.firstName ? item.user?.firstName + ' ' : ''}${item.user?.name}${
              item.user?.address?.city ? ', ' + item.user?.address?.city : ''
            }`}
          </ActionDetails>
        </ItemCreatedTimelineItem>
      )
    case 'AuthorAction':
      return (
        <ItemCreatedTimelineItem
          date={date}
          link={`/authors/edit/${id}`}
          title={t('dashboard.newAuthor')}>
          <ActionDetails>
            {item.author?.name}
            {item.author?.jobTitle ? ', ' + item.author?.jobTitle : ''}
          </ActionDetails>
        </ItemCreatedTimelineItem>
      )
    case 'PollAction':
      return (
        <ItemOpenedTimelineItem
          date={date}
          link={`/polls/edit/${id}`}
          title={t('dashboard.newPoll')}>
          <ActionDetails>{item?.poll?.question}</ActionDetails>
        </ItemOpenedTimelineItem>
      )
    case 'EventAction':
      return (
        <ItemCreatedTimelineItem
          date={date}
          link={`/events/edit/${id}`}
          title={t('dashboard.newEvent')}>
          <>
            <ActionDetails>{item.event?.name}</ActionDetails>
            <ActionDetails>{item.event?.location}</ActionDetails>
          </>
        </ItemCreatedTimelineItem>
      )
    default:
      return <></>
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

function ItemCreatedTimelineItem(props: {
  date: string
  link: string
  title: string
  children: ReactNode
}) {
  const {date, children, title, link} = props
  const {t} = useTranslation()

  return (
    <>
      <Trans i18nKey={t('dashboard.itemCreated')} values={title}>
        New <Link to={link}>{`${title}`}</Link> has been created
        <p>{RelativeTimeToNow(date)}</p>
        {children}
      </Trans>
    </>
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
    <>
      <Trans i18nKey={t('dashboard.itemOpened')} values={title}>
        New <Link to={link}>{`${title}`}</Link> opened
        <p>{RelativeTimeToNow(date)}</p>
        {children}
      </Trans>
    </>
  )
}
