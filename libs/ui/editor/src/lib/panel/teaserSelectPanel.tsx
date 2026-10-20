import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Drawer,
  FormControl,
  FormControlLabel,
  FormLabel,
  List as MuiList,
  ListItem,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
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
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdDashboard,
  MdDescription,
  MdEvent,
  MdSettings,
} from 'react-icons/md';

import { ChooseEditImage } from '../atoms/chooseEditImage';
import { InfoTooltip } from '../atoms/infoTooltip';
import { ListInput, ListValue } from '../atoms/listInput';
import { Teaser, TeaserLink } from '../blocks/types';
import {
  DRAWER_WIDTHS,
  DrawerActions,
  DrawerBody,
  DrawerHeader,
  DrawerTitle,
} from '../drawer';
import { enqueueSnackbar } from '../snackbar';
import { generateID } from '../utility';
import { ImageEditPanel } from './imageEditPanel';
import { ImageSelectPanel } from './imageSelectPanel';
import { previewForTeaser, TeaserMetadataProperty } from './teaserEditPanel';

const List = styled(MuiList)`
  box-shadow: none;
`;

const ButtonWithMargin = styled(Button)`
  margin-left: 20px;
`;

const InlineDivWithMargin = styled.div`
  display: inline;
  font-size: 12px;
  margin-left: 8px;
`;

const InlineDiv = styled.div`
  display: inline;
  font-size: 12px;
`;

const InputW60 = styled(TextField)`
  width: 60%;
`;

const InputW40 = styled(TextField)`
  width: 40%;
  margin-right: 8px;
`;

const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
`;

const H3 = styled.h3`
  cursor: pointer;
`;

const FormGroup = styled(Box)`
  flex-shrink: 0;
  padding-top: 6px;
  padding-left: 8px;
  white-space: nowrap;
`;

const EventFilterContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const LoadMoreButton = styled(Button)`
  text-align: center;
  margin-top: 16px;
`;

const Loader = styled(CircularProgress)`
  margin: 5rem 0;
  width: 100%;
  display: flex;
  justify-content: center;
`;

const NoData = styled(ListItem)`
  text-align: center;
`;

export interface TeaserSelectPanelProps {
  onClose(): void;
  onSelect(teaserLink: TeaserLink): void;
}

export function TeaserSelectPanel({
  onClose,
  onSelect,
}: TeaserSelectPanelProps) {
  const initialTeaser = {
    title: '',
    preTitle: '',
    lead: '',
    contentUrl: 'https://www.example.com',
    openInNewTab: true,
    image: undefined,
  } as Teaser;

  const [type, setType] = useState<TeaserType>(TeaserType.Article);
  const [image, setImage] = useState(initialTeaser.image);
  const [preTitle, setPreTitle] = useState(initialTeaser.preTitle);
  const [contentUrl, setContentUrl] = useState('');
  const [openInNewTab, setOpenInNewTab] = useState(false);
  const [title, setTitle] = useState(initialTeaser.title);
  const [lead, setLead] = useState(initialTeaser.lead);

  const [isChooseModalOpen, setChooseModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [filter, setFilter] = useState<ArticleFilter>({ title: '' });
  const [eventFilter, setEventFilter] = useState<boolean>(true);
  const [metaDataProperties, setMetadataProperties] = useState<
    ListValue<TeaserMetadataProperty>[]
  >(
    initialTeaser.type === TeaserType.Custom && initialTeaser.properties ?
      initialTeaser.properties.map(metaDataProperty => ({
        id: generateID(),
        value: metaDataProperty,
      }))
    : []
  );

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

  function currentContent() {
    switch (type) {
      case TeaserType.Article:
        return (
          <>
            {isArticleListLoading ?
              <ListItem>
                <CircularProgress />
              </ListItem>
            : null}
            {!isArticleListLoading && articles.length === 0 ?
              <NoData>{t('articleEditor.panels.noDataToDisplay')}</NoData>
            : null}
            {articles.map(article => {
              const states = [];

              if (article.draft) {
                states.push(t('articleEditor.panels.draft'));
              }
              if (article.pending) {
                states.push(t('articleEditor.panels.pending'));
              }
              if (article.published) {
                states.push(t('articleEditor.panels.published'));
              }

              return (
                <ListItem key={article.id}>
                  <H3
                    onClick={() =>
                      onSelect({ type: TeaserType.Article, article })
                    }
                  >
                    {article.latest.title || t('articleEditor.panels.untitled')}
                  </H3>

                  <div>
                    <InlineDiv>
                      {t('articleEditor.panels.createdAt', {
                        createdAt: new Date(article.createdAt),
                      })}
                    </InlineDiv>
                    <InlineDivWithMargin>
                      {t('articleEditor.panels.modifiedAt', {
                        modifiedAt: new Date(article.modifiedAt),
                      })}
                    </InlineDivWithMargin>
                    <InlineDivWithMargin>
                      {states.join(' / ')}
                    </InlineDivWithMargin>
                  </div>
                </ListItem>
              );
            })}
            {articleListData?.articles.pageInfo.hasNextPage && (
              <LoadMoreButton
                variant="contained"
                onClick={loadMoreArticles}
              >
                {t('articleEditor.panels.loadMore')}
              </LoadMoreButton>
            )}
          </>
        );

      case TeaserType.Page:
        return (
          <>
            {isPageListLoading ?
              <ListItem>
                <CircularProgress />
              </ListItem>
            : null}
            {!isPageListLoading && pages.length === 0 ?
              <NoData>{t('articleEditor.panels.noDataToDisplay')}</NoData>
            : null}
            {pages.map(page => {
              const states = [];

              if (page.draft) {
                states.push(t('articleEditor.panels.draft'));
              }
              if (page.pending) {
                states.push(t('articleEditor.panels.pending'));
              }
              if (page.published) {
                states.push(t('articleEditor.panels.published'));
              }

              return (
                <ListItem key={page.id}>
                  <H3 onClick={() => onSelect({ type: TeaserType.Page, page })}>
                    {page.latest.title || t('articleEditor.panels.untitled')}
                  </H3>

                  <div>
                    <InlineDiv>
                      {t('pageEditor.panels.createdAt', {
                        createdAt: new Date(page.createdAt),
                      })}
                    </InlineDiv>

                    <InlineDivWithMargin>
                      {t('pageEditor.panels.modifiedAt', {
                        modifiedAt: new Date(page.modifiedAt),
                      })}
                    </InlineDivWithMargin>

                    <InlineDivWithMargin>
                      {states.join(' / ')}
                    </InlineDivWithMargin>
                  </div>
                </ListItem>
              );
            })}
            {pageListData?.pages.pageInfo.hasNextPage && (
              <Button
                variant="outlined"
                onClick={loadMorePages}
              >
                {t('articleEditor.panels.loadMore')}
              </Button>
            )}
          </>
        );

      case TeaserType.Event:
        return (
          <>
            {isEventListLoading ?
              <ListItem>
                <CircularProgress />
              </ListItem>
            : null}
            {!isEventListLoading && events.length === 0 ?
              <NoData>{t('articleEditor.panels.noDataToDisplay')}</NoData>
            : null}
            {events.map(event => {
              return (
                <ListItem key={event.id}>
                  <H3
                    onClick={() => onSelect({ type: TeaserType.Event, event })}
                  >
                    {event.name || t('articleEditor.panels.untitled')}
                  </H3>
                  <div>
                    <InlineDiv>
                      {t('pageEditor.panels.createdAt', {
                        createdAt: new Date(event.startsAt),
                      })}
                    </InlineDiv>
                    {event.endsAt && (
                      <InlineDivWithMargin>
                        -{' '}
                        {t('pageEditor.panels.modifiedAt', {
                          modifiedAt: new Date(event.endsAt),
                        })}
                      </InlineDivWithMargin>
                    )}
                    <InlineDivWithMargin>{event.status}</InlineDivWithMargin>
                  </div>
                </ListItem>
              );
            })}
            {eventListData?.events?.pageInfo.hasNextPage && (
              <Button
                variant="outlined"
                onClick={loadMoreEvents}
              >
                {t('articleEditor.panels.loadMore')}
              </Button>
            )}
          </>
        );

      case TeaserType.Custom:
        return (
          <>
            <Stack
              direction="row"
              sx={{ justifyContent: 'flex-end' }}
            >
              <Button
                variant="contained"
                onClick={() => {
                  onSelect({
                    ...initialTeaser,
                    type: TeaserType.Custom,
                    preTitle: preTitle || undefined,
                    title: title || undefined,
                    lead: lead || undefined,
                    contentUrl: contentUrl || undefined,
                    properties:
                      metaDataProperties.map(({ value }) => {
                        return value;
                      }) || undefined,
                    image,
                  });
                }}
              >
                {t('articleEditor.panels.confirm')}
              </Button>
              <ButtonWithMargin
                variant="text"
                onClick={() => onClose?.()}
              >
                {t('navigation.overview.cancel')}
              </ButtonWithMargin>
            </Stack>

            {previewForTeaser(initialTeaser, t)}

            <Card>
              <CardHeader title={t('articleEditor.panels.displayOptions')} />

              <CardContent>
                <Stack
                  spacing={3}
                  sx={{ width: '100%' }}
                >
                  <Stack
                    spacing={3}
                    sx={{ width: '100%' }}
                  >
                    <TextField
                      label={t('articleEditor.panels.preTitle')}
                      name="pre-title"
                      value={preTitle}
                      onChange={event => setPreTitle(event.target.value)}
                      fullWidth
                    />

                    <TextField
                      label={t('articleEditor.panels.title')}
                      name="title"
                      value={title}
                      onChange={event => setTitle(event.target.value)}
                      fullWidth
                    />

                    <TextField
                      label={t('articleEditor.panels.lead')}
                      name="lead"
                      value={lead}
                      onChange={event => setLead(event.target.value)}
                      fullWidth
                    />

                    <TextField
                      label={
                        <>
                          {t('articleEditor.panels.contentUrl')}{' '}
                          <InfoTooltip
                            text={t('articleEditor.panels.contentUrlInfo')}
                          />
                        </>
                      }
                      name="content-url"
                      value={contentUrl}
                      onChange={event => setContentUrl(event.target.value)}
                      fullWidth
                    />

                    <Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={!!openInNewTab}
                            onChange={(_event, isChecked: boolean) =>
                              setOpenInNewTab(isChecked)
                            }
                          />
                        }
                        label={t('articleEditor.panels.openInNewTab')}
                      />
                    </Box>

                    <FormControl fullWidth>
                      <FormLabel>
                        {t('articleEditor.panels.properties')}{' '}
                        <InfoTooltip
                          text={t('articleEditor.panels.teaserPropertiesInfo')}
                        />
                      </FormLabel>

                      <ListInput
                        value={metaDataProperties}
                        onChange={setMetadataProperties}
                        defaultValue={{ key: '', value: '', public: true }}
                      >
                        {({ value, onChange }) => (
                          <FlexRow>
                            <InputW40
                              placeholder={t('articleEditor.panels.key')}
                              value={value.key}
                              onChange={event =>
                                onChange({ ...value, key: event.target.value })
                              }
                            />

                            <InputW60
                              placeholder={t('articleEditor.panels.value')}
                              value={value.value}
                              onChange={event =>
                                onChange({
                                  ...value,
                                  value: event.target.value,
                                })
                              }
                            />

                            <FormGroup>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={value.public}
                                    onChange={(_event, isPublic) =>
                                      onChange({ ...value, public: isPublic })
                                    }
                                  />
                                }
                                label={t('articleEditor.panels.public')}
                              />
                            </FormGroup>
                          </FlexRow>
                        )}
                      </ListInput>
                    </FormControl>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <ChooseEditImage
              onSelect={value => {
                setChooseModalOpen(false);
                setImage(value);
              }}
              image={image}
              disabled={false}
              openChooseModalOpen={() => setChooseModalOpen(true)}
              openEditModalOpen={() => setEditModalOpen(true)}
              removeImage={() => setImage(undefined)}
            />

            <Drawer
              anchor="right"
              slotProps={{
                paper: {
                  sx: {
                    display: 'flex',
                    flexDirection: 'column',
                    width: DRAWER_WIDTHS.sm,
                    maxWidth: '100vw',
                  },
                },
              }}
              open={isChooseModalOpen}
              onClose={() => setChooseModalOpen(false)}
            >
              <ImageSelectPanel
                onClose={() => setChooseModalOpen(false)}
                onSelect={value => {
                  setChooseModalOpen(false);
                  setImage(value);
                }}
              />
            </Drawer>

            {image && (
              <Drawer
                anchor="right"
                slotProps={{
                  paper: {
                    sx: {
                      display: 'flex',
                      flexDirection: 'column',
                      width: DRAWER_WIDTHS.sm,
                      maxWidth: '100vw',
                    },
                  },
                }}
                open={isEditModalOpen}
                onClose={() => setEditModalOpen(false)}
              >
                <ImageEditPanel
                  id={image!.id}
                  onClose={() => setEditModalOpen(false)}
                />
              </Drawer>
            )}
          </>
        );
    }
  }

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
        </DrawerActions>
      </DrawerHeader>

      <Tabs
        value={type}
        onChange={(_event, type) => setType(type)}
      >
        <Tab
          value={TeaserType.Article}
          icon={<MdDescription />}
          iconPosition="start"
          label={<>{t('resources.teaserType.article')}</>}
        />
        <Tab
          value={TeaserType.Page}
          icon={<MdDashboard />}
          iconPosition="start"
          label={<>{t('resources.teaserType.page')}</>}
        />
        <Tab
          value={TeaserType.Event}
          icon={<MdEvent />}
          iconPosition="start"
          label={<>{t('resources.teaserType.event')}</>}
        />
        <Tab
          value={TeaserType.Custom}
          icon={<MdSettings />}
          iconPosition="start"
          label={<>{t('resources.teaserType.custom')}</>}
        />
      </Tabs>
      <DrawerBody>
        {type === TeaserType.Event &&
          !isEventListLoading &&
          events.length !== 0 && (
            <EventFilterContainer>
              <FormControlLabel
                control={
                  <Switch
                    checked={eventFilter}
                    onChange={(_event, value) => setEventFilter(value)}
                  />
                }
                label={t('event.list.upcomingOnly')}
              />
            </EventFilterContainer>
          )}

        {type !== TeaserType.Custom && type !== TeaserType.Event && (
          <TextField
            value={filter.title || ''}
            onChange={event => updateFilter(event.target.value as string)}
          />
        )}

        <List>{currentContent()}</List>
      </DrawerBody>
    </>
  );
}
