import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArticleFilter,
  ArticleListDocument,
  ArticleListQueryVariables,
  ArticleSort,
  EventFilter,
  EventListDocument,
  PageFilter,
  PageListDocument,
  PageListQueryVariables,
  PageSort,
  SortOrder,
  TeaserType,
} from '@wepublish/editor/api';
import { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdDashboard,
  MdDescription,
  MdEvent,
  MdSearch,
  MdSettings,
} from 'react-icons/md';

import { Teaser, TeaserLink } from '../blocks/types';
import {
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { enqueueSnackbar } from '../snackbar';
import { TeaserForm, TeaserFormValues } from './teaserForm';
import { useTabPanel } from './useTabPanel';

const SearchField = styled(TextField)`
  margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

const ResultList = styled(List)`
  display: grid;
  gap: ${({ theme }) => theme.spacing(0.5)};
  padding: 0;
`;

const ResultButton = styled(ListItemButton)`
  gap: ${({ theme }) => theme.spacing(1.5)};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
`;

const Thumbnail = styled('div')`
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 72px;
  height: 48px;
  overflow: hidden;
  border-radius: ${({ theme }) => `calc(${theme.shape.borderRadius}px / 2)`};
  background-color: ${({ theme }) => theme.vars.palette.background.default};
  color: ${({ theme }) => theme.vars.palette.text.disabled};
  font-size: 20px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Centered = styled('div')`
  display: grid;
  place-items: center;
  padding: ${({ theme }) => theme.spacing(4, 0)};
`;

type ResultProps = {
  title: string;
  details: string;
  imageUrl?: string | null;
  icon: ReactNode;
  onClick: () => void;
};

function Result({ title, details, imageUrl, icon, onClick }: ResultProps) {
  return (
    <li>
      <ResultButton onClick={onClick}>
        <Thumbnail aria-hidden>
          {imageUrl ?
            <img
              src={imageUrl}
              alt=""
            />
          : icon}
        </Thumbnail>

        <ListItemText
          primary={title}
          secondary={details}
          slotProps={{
            primary: { variant: 'subtitle2' },
            secondary: { variant: 'caption' },
          }}
        />
      </ResultButton>
    </li>
  );
}

export interface TeaserSelectPanelProps {
  onClose(): void;
  onSelect(teaserLink: TeaserLink): void;
}

export function TeaserSelectPanel({
  onClose,
  onSelect,
}: TeaserSelectPanelProps) {
  const customTeaser = { type: TeaserType.Custom } as Teaser;

  const [type, setType] = useState<TeaserType>(TeaserType.Article);
  const { tabProps, panelProps } = useTabPanel(type);
  const [customValues, setCustomValues] = useState<TeaserFormValues>({
    preTitle: '',
    title: '',
    lead: '',
    image: undefined,
    contentUrl: '',
    openInNewTab: false,
    properties: [],
  });
  const [filter, setFilter] = useState<ArticleFilter>({ title: '' });
  const [eventFilter, setEventFilter] = useState<boolean>(true);

  /**
   * EVENTS
   */
  const eventVariables = {
    filter: { upcomingOnly: eventFilter } as EventFilter,
    take: 20,
  };

  const {
    data: eventListData,
    fetchMore: fetchMoreEvents,
    error: eventListError,
    loading: isEventListLoading,
  } = useQuery(EventListDocument, {
    variables: eventVariables,
  });

  const events = eventListData?.events?.nodes ?? [];

  /**
   * PAGES & ARTICLES
   */
  const listVariables = {
    filter: filter || undefined,
    take: 20,
    sort: ArticleSort.ModifiedAt,
    order: SortOrder.Descending,
  } as ArticleListQueryVariables;
  const pageListVariables = {
    filter: filter as PageFilter,
    take: 20,
    sort: PageSort.ModifiedAt,
    order: SortOrder.Descending,
  } as PageListQueryVariables;

  const {
    data: articleListData,
    fetchMore: fetchMoreArticles,
    error: articleListError,
    loading: isArticleListLoading,
  } = useQuery(ArticleListDocument, {
    variables: listVariables,
  });

  const {
    data: pageListData,
    fetchMore: fetchMorePages,
    error: pageListError,
    loading: isPageListLoading,
  } = useQuery(PageListDocument, {
    variables: pageListVariables,
  });

  const articles = articleListData?.articles.nodes ?? [];
  const pages = pageListData?.pages.nodes ?? [];

  const { t } = useTranslation();

  useEffect(() => {
    if (articleListError ?? pageListError ?? eventListError) {
      enqueueSnackbar('', {
        variant: 'error',
        title:
          articleListError?.message ??
          pageListError?.message ??
          eventListError?.message ??
          t('toast.updateError'),
        autoHideDuration: 5000,
      });
    }
  }, [articleListError, pageListError, eventListError]);

  function loadMoreArticles() {
    fetchMoreArticles({
      variables: {
        ...listVariables,
        cursor: articleListData?.articles.pageInfo.endCursor,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) {
          return prev;
        }

        return {
          __typename: 'Query',
          articles: {
            ...fetchMoreResult.articles,
            nodes: [...prev.articles.nodes, ...fetchMoreResult.articles.nodes],
          },
        };
      },
    });
  }

  function loadMorePages() {
    fetchMorePages({
      variables: {
        ...pageListVariables,
        cursor: pageListData?.pages.pageInfo.endCursor,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) {
          return prev;
        }

        return {
          __typename: 'Query',
          pages: {
            ...fetchMoreResult.pages,
            nodes: [...prev.pages.nodes, ...fetchMoreResult.pages.nodes],
          },
        };
      },
    });
  }

  function loadMoreEvents() {
    fetchMoreEvents({
      variables: {
        ...eventVariables,
        cursorId: eventListData?.events?.pageInfo.endCursor,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult?.events) {
          return prev;
        }

        return {
          __typename: 'Query',
          events: {
            ...fetchMoreResult.events,
            nodes: [
              ...(prev.events?.nodes || []),
              ...fetchMoreResult.events.nodes,
            ],
          },
        };
      },
    });
  }

  const updateFilter = (value: string) =>
    setFilter(oldFilter => ({
      ...oldFilter,
      title: value,
    }));

  const statesOf = (item: {
    draft?: unknown;
    pending?: unknown;
    published?: unknown;
  }) =>
    [
      item.draft && t('articleEditor.panels.draft'),
      item.pending && t('articleEditor.panels.pending'),
      item.published && t('articleEditor.panels.published'),
    ]
      .filter(Boolean)
      .join(' / ');

  const listState = (loading: boolean, empty: boolean) =>
    loading ?
      <Centered>
        <CircularProgress size={24} />
      </Centered>
    : empty ?
      <Centered>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          {t('articleEditor.panels.noDataToDisplay')}
        </Typography>
      </Centered>
    : null;

  const loadMore = (onClick: () => void) => (
    <Button
      variant="outlined"
      onClick={onClick}
      fullWidth
    >
      {t('articleEditor.panels.loadMore')}
    </Button>
  );

  const confirmCustom = () =>
    onSelect({
      type: TeaserType.Custom,
      preTitle: customValues.preTitle || undefined,
      title: customValues.title || undefined,
      lead: customValues.lead || undefined,
      contentUrl: customValues.contentUrl || undefined,
      openInNewTab: !!customValues.openInNewTab,
      properties: customValues.properties.map(({ value }) => value),
      image: customValues.image ?? undefined,
    } as TeaserLink);

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{t('articleEditor.panels.chooseTeaser')}</DrawerTitle>

        <DrawerActions>
          <Button
            variant="text"
            onClick={() => onClose?.()}
          >
            {t('articleEditor.panels.close')}
          </Button>

          {type === TeaserType.Custom && (
            <Button
              variant="contained"
              onClick={confirmCustom}
            >
              {t('articleEditor.panels.confirm')}
            </Button>
          )}
        </DrawerActions>
      </DrawerHeader>

      <Tabs
        value={type}
        onChange={(_event, type) => setType(type)}
        variant="scrollable"
      >
        <Tab
          value={TeaserType.Article}
          {...tabProps(TeaserType.Article)}
          icon={<MdDescription />}
          iconPosition="start"
          label={t('resources.teaserType.article')}
        />
        <Tab
          value={TeaserType.Page}
          {...tabProps(TeaserType.Page)}
          icon={<MdDashboard />}
          iconPosition="start"
          label={t('resources.teaserType.page')}
        />
        <Tab
          value={TeaserType.Event}
          {...tabProps(TeaserType.Event)}
          icon={<MdEvent />}
          iconPosition="start"
          label={t('resources.teaserType.event')}
        />
        <Tab
          value={TeaserType.Custom}
          {...tabProps(TeaserType.Custom)}
          icon={<MdSettings />}
          iconPosition="start"
          label={t('resources.teaserType.custom')}
        />
      </Tabs>

      <DrawerBody {...panelProps}>
        {(type === TeaserType.Article || type === TeaserType.Page) && (
          <SearchField
            label={t('articleEditor.panels.search')}
            value={filter.title || ''}
            onChange={event => updateFilter(event.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <MdSearch />
                  </InputAdornment>
                ),
              },
            }}
            fullWidth
          />
        )}

        {type === TeaserType.Event && (
          <FormControlLabel
            control={
              <Checkbox
                checked={eventFilter}
                onChange={(_event, value) => setEventFilter(value)}
              />
            }
            label={t('event.list.upcomingOnly')}
          />
        )}

        {type === TeaserType.Article && (
          <>
            {listState(isArticleListLoading, !articles.length)}
            <ResultList>
              {articles.map(article => (
                <Result
                  key={article.id}
                  title={
                    article.latest.title || t('articleEditor.panels.untitled')
                  }
                  details={[
                    statesOf(article),
                    t('articleEditor.panels.modifiedAt', {
                      modifiedAt: new Date(article.modifiedAt),
                    }),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  imageUrl={article.latest.image?.previewURL}
                  icon={<MdDescription />}
                  onClick={() =>
                    onSelect({ type: TeaserType.Article, article })
                  }
                />
              ))}
            </ResultList>
            {articleListData?.articles.pageInfo.hasNextPage &&
              loadMore(loadMoreArticles)}
          </>
        )}

        {type === TeaserType.Page && (
          <>
            {listState(isPageListLoading, !pages.length)}
            <ResultList>
              {pages.map(page => (
                <Result
                  key={page.id}
                  title={
                    page.latest.title || t('articleEditor.panels.untitled')
                  }
                  details={[
                    statesOf(page),
                    t('pageEditor.panels.modifiedAt', {
                      modifiedAt: new Date(page.modifiedAt),
                    }),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  imageUrl={page.latest.image?.previewURL}
                  icon={<MdDashboard />}
                  onClick={() => onSelect({ type: TeaserType.Page, page })}
                />
              ))}
            </ResultList>
            {pageListData?.pages.pageInfo.hasNextPage &&
              loadMore(loadMorePages)}
          </>
        )}

        {type === TeaserType.Event && (
          <>
            {listState(isEventListLoading, !events.length)}
            <ResultList>
              {events.map(event => (
                <Result
                  key={event.id}
                  title={event.name || t('articleEditor.panels.untitled')}
                  details={[
                    t('event.list.startsAt', {
                      startsAt: new Date(event.startsAt),
                    }),
                    event.status &&
                      t(`event.form.${event.status.toLowerCase()}`),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  imageUrl={event.image?.previewURL}
                  icon={<MdEvent />}
                  onClick={() => onSelect({ type: TeaserType.Event, event })}
                />
              ))}
            </ResultList>
            {eventListData?.events?.pageInfo.hasNextPage &&
              loadMore(loadMoreEvents)}
          </>
        )}

        {type === TeaserType.Custom && (
          <TeaserForm
            teaser={customTeaser}
            values={customValues}
            onChange={patch =>
              setCustomValues(current => ({ ...current, ...patch }))
            }
          />
        )}
      </DrawerBody>
    </>
  );
}
