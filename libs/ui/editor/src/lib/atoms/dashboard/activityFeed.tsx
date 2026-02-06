import styled from '@emotion/styled';
import {
  getApiClientV2,
  RecentActionsQuery,
  useRecentActionsQuery,
} from '@wepublish/editor/api-v2';
import { formatDistanceToNow } from 'date-fns';
import { ReactNode, useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  MdAccountCircle,
  MdAutorenew,
  MdChat,
  MdDashboard,
  MdDescription,
  MdEvent,
  MdGroup,
  MdQueryStats,
} from 'react-icons/md';
import { Link } from 'react-router-dom';
import { Avatar, Message, Timeline as RTimeline, toaster } from 'rsuite';

import { RichTextBlock } from '../../blocks/richTextBlock/rich-text-block';
import { AVAILABLE_LANG } from '../../utility';

const Timeline = styled(RTimeline)`
  margin-left: 10px;
`;

const TimelineItemStyled = styled(RTimeline.Item)`
  margin-left: 20px;
`;

const TimelineItemDetails = styled.div`
  margin-left: 10px;
  margin-bottom: 10px;
`;

const TimelineRichTextWrapper = styled.div`
  font-style: italic;
  color: gray;
  margin-left: 30px;
`;

const ActionDetails = styled.div`
  font-style: italic;
  padding-top: 2px;
  color: gray;
`;

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
`;

type Action = NonNullable<RecentActionsQuery['actions']>[number];

export function ActivityFeed() {
  const client = getApiClientV2();
  const { data, error } = useRecentActionsQuery({
    client,
    fetchPolicy: 'cache-and-network',
  });

  const actions = data?.actions ?? [];

  useEffect(() => {
    if (error)
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={0}
        >
          {error.message}
        </Message>
      );
  }, [error]);

  return (
    <Timeline>
      {actions?.map((action: Action, i) => {
        return (
          <TimelineItemContainer
            key={i}
            action={action}
          />
        );
      })}
    </Timeline>
  );
}

function RelativeTimeToNow(time: string) {
  const { i18n } = useTranslation();

  return formatDistanceToNow(new Date(time), {
    locale: AVAILABLE_LANG.find(lang => lang.id === i18n.language)?.locale,
    addSuffix: true,
  });
}

export type TimelineItemContainerProps = {
  key: number;
  action: Action;
};

function TimelineItemContainer(props: TimelineItemContainerProps) {
  const { action, key } = props;
  const { t } = useTranslation();

  switch (action.__typename) {
    case 'ArticleCreatedAction':
      return (
        <TimelineItem
          key={key}
          icon={<MdDescription />}
          summary={
            <TranslationWithLink
              translationKey={t('dashboard.newArticle')}
              link={`/articles/edit/${action.article.id}`}
            />
          }
          date={action.date}
          details={
            action.article.latest.title ??
            action.article.latest.socialMediaTitle ??
            t('articles.overview.untitled')
          }
        />
      );
    case 'PageCreatedAction':
      return (
        <TimelineItem
          key={key}
          icon={<MdDashboard />}
          summary={
            <TranslationWithLink
              translationKey={t('dashboard.newPage')}
              link={`/pages/edit/${action.page.id}`}
            />
          }
          date={action.date}
          details={
            action.page.latest.title ??
            action.page.latest.socialMediaTitle ??
            t('pages.overview.untitled')
          }
        />
      );
    case 'CommentCreatedAction': {
      const userName =
        action.comment?.user?.name ?? action.comment?.guestUsername ?? '';
      const commentTitle =
        action.comment.title ? ': ' + action.comment.title : '';

      return (
        <TimelineItem
          key={key}
          icon={<MdChat />}
          summary={
            <TranslationWithLink
              translationKey={t('dashboard.newComment')}
              link={`/comments/edit/${action.comment.id}`}
            />
          }
          date={action.date}
          details={
            <>
              {userName + commentTitle}
              <TimelineRichTextWrapper>
                <RichTextBlock
                  displayOnly
                  displayOneLine
                  disabled
                  onChange={() => {
                    return undefined;
                  }}
                  value={action.comment.text || []}
                />
              </TimelineRichTextWrapper>
            </>
          }
        />
      );
    }
    case 'SubscriptionCreatedAction':
      return (
        <TimelineItem
          key={key}
          icon={<MdAutorenew />}
          summary={
            <TranslationWithLink
              translationKey={t('dashboard.newSubscription')}
              link={`/subscriptions/edit/${action.subscription.id}`}
            />
          }
          date={action.date}
          details={
            <>
              {action.subscription.memberPlan.name}:{' '}
              {action.subscription.user?.firstName}{' '}
              {action.subscription.user?.name}
            </>
          }
        />
      );
    case 'UserCreatedAction':
      return (
        <TimelineItem
          key={key}
          icon={<MdAccountCircle />}
          summary={
            <TranslationWithLink
              translationKey={t('dashboard.newUser')}
              link={`/users/edit/${action.user.id}`}
            />
          }
          date={action.date}
          details={`${action.user.firstName ? action.user.firstName + ' ' : ''}${action.user.name}`}
        />
      );
    case 'AuthorCreatedAction':
      return (
        <TimelineItem
          key={key}
          icon={<MdGroup />}
          summary={
            <TranslationWithLink
              translationKey={t('dashboard.newAuthor')}
              link={`/authors/edit/${action.author.id}`}
            />
          }
          date={action.date}
          details={
            <>
              {action.author.name}
              {action.author.jobTitle && `, ${action.author.jobTitle}`}
            </>
          }
        />
      );
    case 'PollStartedAction':
      return (
        <TimelineItem
          key={key}
          icon={<MdQueryStats />}
          summary={
            <TranslationWithLink
              link={`/polls/edit/${action.poll.id}`}
              translationKey={t('dashboard.newPoll')}
            />
          }
          date={action.date}
          details={action.poll.question}
        />
      );
    case 'EventCreatedAction':
      return (
        <TimelineItem
          key={key}
          icon={<MdEvent />}
          summary={
            <TranslationWithLink
              translationKey={t('dashboard.newEvent')}
              link={`/events/edit/${action.event.id}`}
            />
          }
          date={action.date}
          details={
            <>
              {action.event.name}
              {action.event.location}
            </>
          }
        />
      );
    default:
      return null;
  }
}

type TimelineItemCustomProps = {
  key: number;
  icon: JSX.Element;
  summary: ReactNode;
  date: string;
  details: ReactNode;
};

function TimelineItem({
  key,
  icon,
  summary,
  date,
  details,
}: TimelineItemCustomProps) {
  return (
    <TimelineItemStyled
      key={key}
      dot={
        <TimelineIcon
          size="sm"
          circle
        >
          {icon}
        </TimelineIcon>
      }
    >
      <TimelineItemDetails>
        {summary}
        <p>{RelativeTimeToNow(date)}</p>
        <ActionDetails>{details}</ActionDetails>
      </TimelineItemDetails>
    </TimelineItemStyled>
  );
}

function TranslationWithLink(props: { link: string; translationKey: string }) {
  const { link, translationKey } = props;

  return (
    <Trans
      i18nKey={translationKey}
      components={[<Link to={link} />]}
    />
  );
}
