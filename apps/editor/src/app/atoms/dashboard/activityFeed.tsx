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

const TimelineItemStyled = styled(RTimeline.Item)`
  margin-left: '20px';
`

const TimelineItemDetails = styled.div`
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
        return <TimelineItemContainer key={i} action={action} />
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
  key: number
  action: Action
}

function TimelineItemContainer(props: Props) {
  const {action, key} = props
  const {t} = useTranslation()

  switch (action.__typename) {
    case 'ArticleCreatedAction':
      return (
        <TimelineItem
          key={key}
          icon={<MdDescription />}
          summary={
            <ItemCreatedSummary
              link={`/articles/edit/${action.article.id}`}
              title={t('dashboard.newArticle')}
            />
          }
          date={action.date}
          details={action.article.latest?.title ?? t('articles.overview.untitled')}
        />
      )
    case 'PageCreatedAction':
      return (
        <TimelineItem
          key={key}
          icon={<MdDashboard />}
          summary={
            <ItemCreatedSummary
              link={`/pages/edit/${action.page.id}`}
              title={t('dashboard.newPage')}
            />
          }
          date={action.date}
          details={
            action.page.latest.title ??
            action.page.latest.socialMediaTitle ??
            t('pages.overview.untitled')
          }
        />
      )
    case 'CommentCreatedAction':
      return (
        <TimelineItem
          key={key}
          icon={<MdChat />}
          summary={
            <ItemCreatedSummary
              link={`/comments/edit/${action.comment.id}`}
              title={t('dashboard.newComment')}
            />
          }
          date={action.date}
          details={
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
          }
        />
      )
    case 'SubscriptionCreatedAction':
      return (
        <TimelineItem
          key={key}
          icon={<MdAutorenew />}
          summary={
            <ItemCreatedSummary
              link={`/subscriptions/edit/${action.subscription.id}`}
              title={t('dashboard.newSubscription')}
            />
          }
          date={action.date}
          details={
            <>
              {action.subscription.memberPlan.name}: {action.subscription.user?.email}
            </>
          }
        />
      )
    case 'UserCreatedAction':
      return (
        <TimelineItem
          key={key}
          icon={<MdAccountCircle />}
          summary={
            <ItemCreatedSummary
              link={`/users/edit/${action.user.id}`}
              title={t('dashboard.newUser')}
            />
          }
          date={action.date}
          details={`${action.user.firstName ? action.user.firstName + ' ' : ''}${action.user.name}${
            action.user.address?.city ? ', ' + action.user.address?.city : ''
          }`}
        />
      )
    case 'AuthorCreatedAction':
      return (
        <TimelineItem
          key={key}
          icon={<MdGroup />}
          summary={
            <ItemCreatedSummary
              link={`/authors/edit/${action.author.id}`}
              title={t('dashboard.newAuthor')}
            />
          }
          date={action.date}
          details={
            <>
              {action.author.name}
              {action.author.jobTitle ? ', ' + action.author.jobTitle : ''}
            </>
          }
        />
      )
    case 'PollStartedAction':
      return (
        <TimelineItem
          key={key}
          icon={<MdOutlineGridView />}
          summary={
            <ItemOpenedSummary
              link={`/polls/edit/${action.poll.id}`}
              title={t('dashboard.newPoll')}
            />
          }
          date={action.date}
          details={<ActionDetails>{action.poll.question}</ActionDetails>}
        />
      )
    case 'EventCreatedAction':
      return (
        <TimelineItem
          key={key}
          icon={<MdEvent />}
          summary={
            <ItemCreatedSummary
              link={`/events/edit/${action.event.id}`}
              title={t('dashboard.newEvent')}
            />
          }
          date={action.date}
          details={
            <>
              <ActionDetails>{action.event.name}</ActionDetails>
              <ActionDetails>{action.event.location}</ActionDetails>
            </>
          }
        />
      )
    default:
      return <></>
  }
}

type TimelineItemCustomProps = {
  key: number
  icon: JSX.Element
  summary: ReactNode
  date: string
  details: ReactNode
}

function TimelineItem({key, icon, summary, date, details}: TimelineItemCustomProps) {
  return (
    <TimelineItemStyled
      key={key}
      dot={
        <TimelineIcon size="sm" circle>
          {icon}
        </TimelineIcon>
      }>
      <TimelineItemDetails>
        {summary}
        <p>{RelativeTimeToNow(date)}</p>
        <ActionDetails>{details}</ActionDetails>
      </TimelineItemDetails>
    </TimelineItemStyled>
  )
}

function ItemCreatedSummary(props: {title: string; link: string}) {
  const {title, link} = props
  return (
    <Trans i18nKey={'dashboard.itemCreated'} values={{title}}>
      New <Link to={link}>{`${title}`}</Link> has been created
    </Trans>
  )
}

function ItemOpenedSummary(props: {title: string; link: string}) {
  const {title, link} = props
  return (
    <Trans i18nKey={'dashboard.itemOpened'} values={{title}}>
      New <Link to={link}>{`${title}`}</Link> opened
    </Trans>
  )
}
