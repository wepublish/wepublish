import styled from '@emotion/styled'
import {ActionType, RecentActionsQuery, useRecentActionsQuery} from '@wepublish/editor/api'
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
                <TimelineItemDetails date={action.date} item={action.item} />
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

function TimelineItemDetails({date, item}: Omit<Action, 'actionType'>) {
  const {t} = useTranslation()

  switch (item?.__typename) {
    case 'Article':
      return (
        <ItemCreatedTimelineItem
          title={t('dashboard.newArticle')}
          link={`/articles/edit/${item.id}`}
          date={date}>
          <ActionDetails>{item?.latest?.title ?? t('articles.overview.untitled')}</ActionDetails>
        </ItemCreatedTimelineItem>
      )
    case 'Page':
      return (
        <ItemCreatedTimelineItem
          title={t('dashboard.newPage')}
          link={`/pages/edit/${item?.id}`}
          date={date}>
          <ActionDetails>
            {item?.latest?.title ?? item?.latest?.socialMediaTitle ?? t('pages.overview.untitled')}
          </ActionDetails>
        </ItemCreatedTimelineItem>
      )
    case 'Comment':
      return (
        <ItemCreatedTimelineItem
          date={date}
          link={`/comments/edit/${item.id}`}
          title={t('dashboard.newComment')}>
          <>
            <ActionDetails>
              {`${item?.user?.name ?? item?.guestUsername ?? ''} ${
                item?.revisions[item?.revisions?.length - 1]?.title
                  ? ': ' + item?.revisions[item?.revisions?.length - 1]?.title
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
                value={item?.revisions[item?.revisions?.length - 1]?.text || []}
              />
            </TimelineRichTextWrapper>
          </>
        </ItemCreatedTimelineItem>
      )
    case 'Subscription':
      return (
        <ItemCreatedTimelineItem
          date={date}
          link={`/subscriptions/edit/${item.id}`}
          title={t('dashboard.newSubscription')}>
          <ActionDetails>
            {item?.memberPlan.name}: {item?.user?.email}
          </ActionDetails>
        </ItemCreatedTimelineItem>
      )
    case 'User':
      // TODO add user id and link
      return (
        <ItemCreatedTimelineItem date={date} link={''} title={t('dashboard.newUser')}>
          <ActionDetails>
            {`${item?.firstName ? item?.firstName + ' ' : ''}${item?.name}${
              item?.address?.city ? ', ' + item?.address?.city : ''
            }`}
          </ActionDetails>
        </ItemCreatedTimelineItem>
      )
    case 'Author':
      return (
        <ItemCreatedTimelineItem
          date={date}
          link={`/authors/edit/${item.id}`}
          title={t('dashboard.newAuthor')}>
          <ActionDetails>
            {item?.name}
            {item?.jobTitle ? ', ' + item?.jobTitle : ''}
          </ActionDetails>
        </ItemCreatedTimelineItem>
      )
    case 'Poll':
      return (
        <ItemOpenedTimelineItem
          date={date}
          link={`/polls/edit/${item.id}`}
          title={t('dashboard.newPoll')}>
          <ActionDetails>{item?.question}</ActionDetails>
        </ItemOpenedTimelineItem>
      )
    case 'Event':
      return (
        <ItemCreatedTimelineItem
          date={date}
          link={`/events/edit/${item.id}`}
          title={t('dashboard.newEvent')}>
          <>
            <ActionDetails>{item?.name}</ActionDetails>
            <ActionDetails>{item?.location}</ActionDetails>
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
