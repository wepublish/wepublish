import { useQuery } from '@apollo/client/react';
import { css, Theme } from '@emotion/react';
import styled from '@emotion/styled';
import {
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ActionType,
  RecentActionsDocument,
  RecentActionsQuery,
} from '@wepublish/editor/api';
import { toPlaintext } from '@wepublish/richtext';
import { formatDistanceToNow } from 'date-fns';
import { TFunction } from 'i18next';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  MdAccountCircle,
  MdAutorenew,
  MdChat,
  MdChevronLeft,
  MdChevronRight,
  MdDashboard,
  MdDescription,
  MdEvent,
  MdFilterList,
  MdGroup,
  MdQueryStats,
} from 'react-icons/md';
import { Link } from 'react-router-dom';

import { ClickPopover } from '../../popover';
import { AVAILABLE_LANG } from '../../utility';

type Action = NonNullable<RecentActionsQuery['actions']>[number];

type ActivityItem = {
  icon: ReactNode;
  labelKey: string;
  link?: string;
  date: string;
  title?: string;
  excerpt?: string;
};

const ICON_SIZE = 32;
const TILE_WIDTH = 200;
const TILE_GAP = 16;
const ONE_LINE = 28;
const HOLD_DELAY_MS = 350;
const HOLD_SPEED_PX_PER_MS = 0.9;

export const ACTIVITY_FILTER_STORAGE_KEY = 'wepublish/dashboardActivityTypes';

const ACTIVITY_TYPES = [
  ActionType.ArticleCreated,
  ActionType.PageCreated,
  ActionType.CommentCreated,
  ActionType.SubscriptionCreated,
  ActionType.UserCreated,
  ActionType.AuthorCreated,
  ActionType.PollStarted,
  ActionType.EventCreated,
];

const readStoredTypes = (): ActionType[] => {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(ACTIVITY_FILTER_STORAGE_KEY) ?? 'null'
    );
    const types =
      Array.isArray(stored) ?
        ACTIVITY_TYPES.filter(type => stored.includes(type))
      : [];

    return types.length ? types : ACTIVITY_TYPES;
  } catch {
    return ACTIVITY_TYPES;
  }
};

const Feed = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  min-height: 0;
`;

const Navigation = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 4px;
`;

const FilterList = styled.div`
  display: grid;
  gap: 2px;
  min-width: 180px;
`;

const Track = styled.ol`
  display: flex;
  align-items: stretch;
  gap: ${TILE_GAP}px;
  margin: 0;
  padding: 0 0 8px;
  list-style: none;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;

  background: linear-gradient(
      color-mix(
        in srgb,
        ${({ theme }) => theme.vars.palette.primary.main} 40%,
        transparent
      ),
      color-mix(
        in srgb,
        ${({ theme }) => theme.vars.palette.primary.main} 40%,
        transparent
      )
    )
    0 ${ICON_SIZE / 2 - 1}px / 100% 2px no-repeat;
  background-attachment: local;
`;

const Entry = styled.li`
  position: relative;
  flex: 0 0 ${TILE_WIDTH}px;
  min-width: 0;
  max-width: ${TILE_WIDTH}px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  scroll-snap-align: start;
`;

const EntryIcon = styled.span`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${ICON_SIZE}px;
  height: ${ICON_SIZE}px;
  border: 2px solid ${({ theme }) => theme.vars.palette.primary.main};
  border-radius: 50%;
  background: ${({ theme }) => theme.vars.palette.background.paper};
  color: ${({ theme }) => theme.vars.palette.primary.main};
  font-size: 16px;
`;

const tileStyles = ({ theme }: { theme: Theme }) => css`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
  padding: 10px 12px;
  border: 1px solid ${theme.vars.palette.divider};
  border-radius: ${theme.shape.borderRadius + 'px'};
  background: ${theme.vars.palette.background.paper};
  color: ${theme.vars.palette.text.primary};
  font-size: 13px;
  line-height: 1.4;
  overflow: hidden;
  text-decoration: none;

  &:hover,
  &:focus {
    color: ${theme.vars.palette.text.primary};
    text-decoration: none;
    border-color: ${theme.vars.palette.primary.main};
  }
`;

const Tile = styled(Link)(tileStyles);

const StaticTile = styled('div')(tileStyles);

const oneLine = `
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const Label = styled.span`
  ${oneLine}
  color: ${({ theme }) => theme.vars.palette.text.secondary};

  strong {
    color: ${({ theme }) => theme.vars.palette.text.primary};
  }
`;

const Title = styled.span`
  ${oneLine}
  font-weight: 600;
`;

const Excerpt = styled.span`
  ${oneLine}
  color: ${({ theme }) => theme.vars.palette.text.secondary};
  font-style: italic;
`;

const Time = styled.span`
  ${oneLine}
  margin-top: auto;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
  font-size: 12px;
`;

const TooltipText = styled.span`
  display: block;
  max-height: 240px;
  overflow: hidden;
  white-space: pre-line;
  text-align: left;
`;

const Note = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.vars.palette.text.secondary};
`;

const joinNames = (...names: (string | null | undefined)[]) =>
  names.filter(Boolean).join(' ');

const toActivityItem = (action: Action, t: TFunction): ActivityItem | null => {
  switch (action.__typename) {
    case 'ArticleCreatedAction':
      return {
        icon: <MdDescription />,
        labelKey: 'dashboard.newArticle',
        link: `/articles/edit/${action.article.id}`,
        date: action.date,
        title:
          action.article.latest.title ??
          action.article.latest.socialMediaTitle ??
          t('articles.overview.untitled'),
      };
    case 'PageCreatedAction':
      return {
        icon: <MdDashboard />,
        labelKey: 'dashboard.newPage',
        link: `/pages/edit/${action.page.id}`,
        date: action.date,
        title:
          action.page.latest.title ??
          action.page.latest.socialMediaTitle ??
          t('pages.overview.untitled'),
      };
    case 'CommentCreatedAction':
      return {
        icon: <MdChat />,
        labelKey: 'dashboard.newComment',
        link: `/comments/edit/${action.comment.id}`,
        date: action.date,
        title:
          joinNames(
            action.comment.user?.firstName,
            action.comment.user?.name
          ) ||
          action.comment.guestUsername ||
          undefined,
        excerpt: [
          action.comment.title,
          toPlaintext(action.comment.text?.content ?? action.comment.text),
        ]
          .filter(Boolean)
          .join(': '),
      };
    case 'SubscriptionCreatedAction':
      return {
        icon: <MdAutorenew />,
        labelKey: 'dashboard.newSubscription',
        link: `/subscriptions/edit/${action.subscription.id}`,
        date: action.date,
        title: joinNames(
          action.subscription.user?.firstName,
          action.subscription.user?.name
        ),
        excerpt: action.subscription.memberPlan.name,
      };
    case 'UserCreatedAction':
      return {
        icon: <MdAccountCircle />,
        labelKey: 'dashboard.newUser',
        link: `/users/edit/${action.user.id}`,
        date: action.date,
        title: joinNames(action.user.firstName, action.user.name),
      };
    case 'AuthorCreatedAction':
      return {
        icon: <MdGroup />,
        labelKey: 'dashboard.newAuthor',
        link: `/authors/edit/${action.author.id}`,
        date: action.date,
        title: action.author.name,
        excerpt: action.author.jobTitle ?? undefined,
      };
    case 'PollStartedAction':
      return {
        icon: <MdQueryStats />,
        labelKey: 'dashboard.newPoll',
        link: `/polls/edit/${action.poll.id}`,
        date: action.date,
        title: action.poll.question ?? undefined,
      };
    case 'EventCreatedAction':
      return {
        icon: <MdEvent />,
        labelKey: 'dashboard.newEvent',
        date: action.date,
        title: action.event.name ?? undefined,
        excerpt: action.event.location ?? undefined,
      };
    default:
      return null;
  }
};

function ActivityEntry({ item }: { item: ActivityItem }) {
  const { i18n } = useTranslation();
  const isTrimmable = [item.title, item.excerpt].some(
    text => (text?.length ?? 0) > ONE_LINE
  );
  const fullText = [item.title, item.excerpt].filter(Boolean).join('\n');

  const content = (
    <>
      <Label>
        <Trans
          i18nKey={item.labelKey}
          components={[<strong />]}
        />
      </Label>
      {item.title && <Title>{item.title}</Title>}
      {item.excerpt && <Excerpt>{item.excerpt}</Excerpt>}
      <Time>
        {formatDistanceToNow(new Date(item.date), {
          locale: AVAILABLE_LANG.find(lang => lang.id === i18n.language)
            ?.locale,
          addSuffix: true,
        })}
      </Time>
    </>
  );

  const tile =
    item.link ?
      <Tile to={item.link}>{content}</Tile>
    : <StaticTile>{content}</StaticTile>;

  return (
    <Entry>
      <EntryIcon aria-hidden>{item.icon}</EntryIcon>
      {isTrimmable ?
        <Tooltip
          placement="top"
          title={<TooltipText>{fullText}</TooltipText>}
        >
          {tile}
        </Tooltip>
      : tile}
    </Entry>
  );
}

export function ActivityFeed() {
  const { t } = useTranslation();
  const [types, setTypes] = useState(readStoredTypes);
  const filtered = types.length < ACTIVITY_TYPES.length;
  const { data, error } = useQuery(RecentActionsDocument, {
    variables: { types: filtered ? types : undefined },
  });
  const trackRef = useRef<HTMLOListElement>(null);

  const changeTypes = (next: ActionType[]) => {
    setTypes(next);
    trackRef.current?.scrollTo({ left: 0 });

    window.localStorage.setItem(
      ACTIVITY_FILTER_STORAGE_KEY,
      JSON.stringify(next)
    );
  };

  const toggleType = (type: ActionType, shown: boolean) =>
    changeTypes(
      ACTIVITY_TYPES.filter(each =>
        each === type ? shown : types.includes(each)
      )
    );
  const [edges, setEdges] = useState({ start: true, end: false });

  const items = (data?.actions ?? [])
    .map(action => toActivityItem(action, t))
    .filter((item): item is ActivityItem => !!item);

  const updateEdges = useCallback(() => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    setEdges({
      start: track.scrollLeft <= 0,
      end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 1,
    });
  }, []);

  useEffect(updateEdges, [updateEdges, items.length]);

  const scrollByTile = (direction: 1 | -1) =>
    trackRef.current?.scrollBy({
      left: direction * (TILE_WIDTH + TILE_GAP),
      behavior: 'smooth',
    });

  const hold = useRef<{
    timer?: ReturnType<typeof setTimeout>;
    frame?: number;
    scrolling: boolean;
    release?: () => void;
  }>({ scrolling: false });

  const stopHold = useCallback(() => {
    const state = hold.current;
    const track = trackRef.current;

    clearTimeout(state.timer);
    if (state.frame !== undefined) {
      cancelAnimationFrame(state.frame);
    }
    state.frame = undefined;

    if (state.release) {
      window.removeEventListener('pointerup', state.release);
      window.removeEventListener('pointercancel', state.release);
      state.release = undefined;
    }

    if (state.scrolling && track) {
      track.style.scrollSnapType = '';
      track.style.scrollBehavior = '';
      const step = TILE_WIDTH + TILE_GAP;
      track.scrollTo({
        left: Math.round(track.scrollLeft / step) * step,
        behavior: 'smooth',
      });
    }

    state.scrolling = false;
  }, []);

  useEffect(() => stopHold, [stopHold]);

  const startPress = (direction: 1 | -1) => {
    const state = hold.current;
    stopHold();

    const release = () => {
      const wasScrolling = state.scrolling;
      stopHold();

      if (!wasScrolling) {
        scrollByTile(direction);
      }
    };
    state.release = release;
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);

    state.timer = setTimeout(() => {
      const track = trackRef.current;

      if (!track) {
        return;
      }

      state.scrolling = true;
      track.style.scrollSnapType = 'none';
      track.style.scrollBehavior = 'auto';
      let last = performance.now();

      const frame = (now: number) => {
        track.scrollLeft += direction * HOLD_SPEED_PX_PER_MS * (now - last);
        last = now;
        updateEdges();

        const atEnd =
          direction > 0 ?
            track.scrollLeft + track.clientWidth >= track.scrollWidth - 1
          : track.scrollLeft <= 0;

        if (atEnd) {
          stopHold();
          return;
        }

        state.frame = requestAnimationFrame(frame);
      };

      state.frame = requestAnimationFrame(frame);
    }, HOLD_DELAY_MS);
  };

  if (error) {
    return <Note>{t('dashboard.activityUnavailable')}</Note>;
  }

  return (
    <Feed>
      <Navigation>
        <ClickPopover
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          trigger={
            <IconButton
              size="small"
              aria-label={t('dashboard.activityFilter')}
              title={t('dashboard.activityFilter')}
            >
              <MdFilterList />
            </IconButton>
          }
        >
          <FilterList>
            {ACTIVITY_TYPES.map(type => {
              const shown = types.includes(type);

              return (
                <FormControlLabel
                  control={
                    <Checkbox
                      key={type}
                      checked={shown}
                      disabled={shown && types.length === 1}
                      onChange={(_event, checked) => toggleType(type, checked)}
                    />
                  }
                  label={t(`dashboard.activityTypes.${type}`)}
                />
              );
            })}
            <Button
              variant="text"
              size="small"
              disabled={!filtered}
              onClick={() => changeTypes(ACTIVITY_TYPES)}
            >
              {t('dashboard.activityFilterAll')}
            </Button>
          </FilterList>
        </ClickPopover>
        <IconButton
          size="small"
          aria-label={t('dashboard.newerActivity')}
          title={t('dashboard.newerActivity')}
          disabled={edges.start}
          onPointerDown={() => startPress(-1)}
          onClick={event => event.detail === 0 && scrollByTile(-1)}
        >
          <MdChevronLeft />
        </IconButton>
        <IconButton
          size="small"
          aria-label={t('dashboard.olderActivity')}
          title={t('dashboard.olderActivity')}
          disabled={edges.end}
          onPointerDown={() => startPress(1)}
          onClick={event => event.detail === 0 && scrollByTile(1)}
        >
          <MdChevronRight />
        </IconButton>
      </Navigation>

      {data && !items.length ?
        <Note>{t('dashboard.noActivity')}</Note>
      : <Track
          ref={trackRef}
          onScroll={updateEdges}
        >
          {items.map((item, index) => (
            <ActivityEntry
              key={`${item.link}-${index}`}
              item={item}
            />
          ))}
        </Track>
      }
    </Feed>
  );
}
