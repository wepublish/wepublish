import styled from '@emotion/styled';
import { PageInfo } from '@wepublish/editor/api';
import {
  ArticleFilter,
  ArticleListQueryVariables,
  ArticleSort,
  EventFilter,
  getApiClientV2,
  PageFilter,
  PageListQueryVariables,
  PageSort,
  SortOrder,
  TeaserType,
  useArticleListQuery,
  useEventListQuery,
  usePageListQuery,
} from '@wepublish/editor/api-v2';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdDashboard,
  MdDescription,
  MdEvent,
  MdSearch,
  MdSettings,
} from 'react-icons/md';
import {
  Button,
  Drawer,
  FlexboxGrid,
  Form,
  Input,
  InputGroup as RInputGroup,
  List as RList,
  Loader as RLoader,
  Nav as RNav,
  Notification,
  Panel,
  toaster,
  Toggle as RToggle,
} from 'rsuite';

import { ChooseEditImage } from '../atoms/chooseEditImage';
import { ListInput, ListValue } from '../atoms/listInput';
import { Teaser, TeaserLink } from '../blocks/types';
import { generateID } from '../utility';
import { ImageEditPanel } from './imageEditPanel';
import { ImageSelectPanel } from './imageSelectPanel';
import { previewForTeaser, TeaserMetadataProperty } from './teaserEditPanel';

const List = styled(RList)`
  box-shadow: none;
`;

const InputGroup = styled(RInputGroup)`
  margin-bottom: 20px;
`;

const Nav = styled(RNav)`
  margin-bottom: 20px;
`;

const Toggle = styled(RToggle)`
  max-width: 70px;
  min-width: 70px;
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

const InputW60 = styled(Input)`
  width: 60%;
`;

const InputW40 = styled(Input)`
  width: 40%;
  margin-right: 10px;
`;

const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
`;

const H3 = styled.h3`
  cursor: pointer;
`;

const FormGroup = styled(Form.Group)`
  padding-top: 6px;
  padding-left: 8px;
`;

const EventFilterContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
`;

const ToggleLabel = styled.span`
  margin-right: 8px;
  margin-bottom: 4px;
`;

const LoadMoreButton = styled(Button)`
  text-align: center;
  margin-top: 16px;
`;

const Loader = styled(RLoader)`
  margin: 5rem 0;
  width: 100%;
  display: flex;
  justify-content: center;
`;

const NoData = styled(RList.Item)`
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

  const client = getApiClientV2();
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
  } = useEventListQuery({
    client,
    fetchPolicy: 'network-only',
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
  } = useArticleListQuery({
    client,
    variables: listVariables,
    fetchPolicy: 'network-only',
  });

  const {
    data: pageListData,
    fetchMore: fetchMorePages,
    error: pageListError,
    loading: isPageListLoading,
  } = usePageListQuery({
    client,
    variables: pageListVariables,
    fetchPolicy: 'cache-and-network',
  });

  const articles = articleListData?.articles.nodes ?? [];
  const pages = pageListData?.pages.nodes ?? [];

  const { t } = useTranslation();

  useEffect(() => {
    if (articleListError ?? pageListError ?? eventListError) {
      toaster.push(
        <Notification
          type="error"
          header={
            articleListError?.message ??
            pageListError?.message ??
            eventListError?.message ??
            t('toast.updateError')
          }
          duration={5000}
        />,
        { placement: 'topEnd' }
      );
    }
  }, [articleListError, pageListError, eventListError]);

  function loadMoreArticles() {
    fetchMoreArticles({
      variables: {
        ...listVariables,
        cursor: articleListData?.articles.pageInfo.endCursor,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;

        return {
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
        ...listVariables,
        cursor: pageListData?.pages.pageInfo.endCursor,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;

        return {
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
        cursor: eventListData?.events?.pageInfo.endCursor,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) {
          return prev;
        }

        return {
          events: {
            ...fetchMoreResult.events,
            nodes: [
              ...(prev.events?.nodes || []),
              ...(fetchMoreResult.events?.nodes || []),
            ],
            totalCount: fetchMoreResult.events?.totalCount as number,
            pageInfo: fetchMoreResult.events?.pageInfo as PageInfo,
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
              <RList.Item>
                <Loader />
              </RList.Item>
            : null}
            {!isArticleListLoading && articles.length === 0 ?
              <NoData>{t('articleEditor.panels.noDataToDisplay')}</NoData>
            : null}
            {articles.map(article => {
              const states = [];

              if (article.draft) states.push(t('articleEditor.panels.draft'));
              if (article.pending)
                states.push(t('articleEditor.panels.pending'));
              if (article.published)
                states.push(t('articleEditor.panels.published'));

              return (
                <RList.Item key={article.id}>
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
                </RList.Item>
              );
            })}
            {articleListData?.articles.pageInfo.hasNextPage && (
              <LoadMoreButton
                onClick={loadMoreArticles}
                appearance="primary"
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
              <RList.Item>
                <Loader />
              </RList.Item>
            : null}
            {!isPageListLoading && pages.length === 0 ?
              <NoData>{t('articleEditor.panels.noDataToDisplay')}</NoData>
            : null}
            {pages.map(page => {
              const states = [];

              if (page.draft) states.push(t('articleEditor.panels.draft'));
              if (page.pending) states.push(t('articleEditor.panels.pending'));
              if (page.published)
                states.push(t('articleEditor.panels.published'));

              return (
                <RList.Item key={page.id}>
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
                </RList.Item>
              );
            })}
            {pageListData?.pages.pageInfo.hasNextPage && (
              <Button onClick={loadMorePages}>
                {t('articleEditor.panels.loadMore')}
              </Button>
            )}
          </>
        );

      case TeaserType.Event:
        return (
          <>
            {isEventListLoading ?
              <RList.Item>
                <Loader />
              </RList.Item>
            : null}
            {!isEventListLoading && events.length === 0 ?
              <NoData>{t('articleEditor.panels.noDataToDisplay')}</NoData>
            : null}
            {events.map(event => {
              return (
                <RList.Item key={event.id}>
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
                </RList.Item>
              );
            })}
            {eventListData?.events?.pageInfo.hasNextPage && (
              <Button onClick={loadMoreEvents}>
                {t('articleEditor.panels.loadMore')}
              </Button>
            )}
          </>
        );

      case TeaserType.Custom:
        return (
          <>
            <FlexboxGrid justify="end">
              <Button
                appearance={'primary'}
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
                appearance={'subtle'}
                onClick={() => onClose?.()}
              >
                {t('navigation.overview.cancel')}
              </ButtonWithMargin>
            </FlexboxGrid>

            {previewForTeaser(initialTeaser, t)}

            <Panel header={t('articleEditor.panels.displayOptions')}>
              <Form fluid>
                <Form.Group controlId="articlePreTitle">
                  <Form.ControlLabel>
                    {t('articleEditor.panels.preTitle')}
                  </Form.ControlLabel>
                  <Form.Control
                    name="pre-title"
                    value={preTitle}
                    onChange={(preTitle: string) => setPreTitle(preTitle)}
                  />
                </Form.Group>
                <Form.Group controlId="articleTitle">
                  <Form.ControlLabel>
                    {t('articleEditor.panels.title')}
                  </Form.ControlLabel>
                  <Form.Control
                    name="title"
                    value={title}
                    onChange={(title: string) => setTitle(title)}
                  />
                </Form.Group>
                <Form.Group controlId="articleLead">
                  <Form.ControlLabel>
                    {t('articleEditor.panels.lead')}
                  </Form.ControlLabel>
                  <Form.Control
                    name="lead"
                    value={lead}
                    onChange={(lead: string) => setLead(lead)}
                  />
                </Form.Group>
                <Form.Group controlId="customTeaserContentUrl">
                  <Form.ControlLabel>
                    {t('articleEditor.panels.contentUrl')}
                  </Form.ControlLabel>
                  <Form.Control
                    name="content-url"
                    value={contentUrl}
                    onChange={(contentUrl: string) => setContentUrl(contentUrl)}
                  />
                </Form.Group>
                <Form.Group controlId="customTeaserOpenInNewTab">
                  <Form.ControlLabel>
                    {t('articleEditor.panels.openInNewTab')}
                  </Form.ControlLabel>
                  <Toggle
                    checkedChildren={t('articleEditor.panels.yes')}
                    unCheckedChildren={t('articleEditor.panels.no')}
                    checked={!!openInNewTab}
                    onChange={(isChecked: boolean) =>
                      setOpenInNewTab(isChecked)
                    }
                  />
                </Form.Group>

                <Form.Group controlId="properties">
                  <Form.ControlLabel>
                    {t('articleEditor.panels.properties')}
                  </Form.ControlLabel>
                  <ListInput
                    value={metaDataProperties}
                    onChange={propertiesItemInput =>
                      setMetadataProperties(propertiesItemInput)
                    }
                    defaultValue={{ key: '', value: '', public: true }}
                  >
                    {({ value, onChange }) => (
                      <FlexRow>
                        <InputW40
                          placeholder={t('articleEditor.panels.key')}
                          value={value.key}
                          onChange={propertyKey =>
                            onChange({ ...value, key: propertyKey })
                          }
                        />

                        <InputW60
                          placeholder={t('articleEditor.panels.value')}
                          value={value.value}
                          onChange={propertyValue =>
                            onChange({ ...value, value: propertyValue })
                          }
                        />

                        <FormGroup controlId="articleProperty">
                          <Toggle
                            checkedChildren={t('articleEditor.panels.public')}
                            unCheckedChildren={t(
                              'articleEditor.panels.private'
                            )}
                            checked={value.public}
                            onChange={isPublic =>
                              onChange({ ...value, public: isPublic })
                            }
                          />
                        </FormGroup>
                      </FlexRow>
                    )}
                  </ListInput>
                </Form.Group>
              </Form>
            </Panel>

            <ChooseEditImage
              image={image}
              disabled={false}
              openChooseModalOpen={() => setChooseModalOpen(true)}
              openEditModalOpen={() => setEditModalOpen(true)}
              removeImage={() => setImage(undefined)}
            />
            <Drawer
              open={isChooseModalOpen}
              size="sm"
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
                open={isEditModalOpen}
                size="sm"
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
      <Drawer.Header>
        <Drawer.Title>{t('articleEditor.panels.chooseTeaser')}</Drawer.Title>

        <Drawer.Actions>
          <Button
            appearance={'subtle'}
            onClick={() => onClose?.()}
          >
            {t('articleEditor.panels.close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>

      <Drawer.Body>
        <Nav
          appearance="tabs"
          activeKey={type}
          onSelect={type => setType(type)}
        >
          <RNav.Item
            eventKey={TeaserType.Article}
            icon={<MdDescription />}
          >
            {t('resources.teaserType.article')}
          </RNav.Item>
          <RNav.Item
            eventKey={TeaserType.Page}
            icon={<MdDashboard />}
          >
            {t('resources.teaserType.page')}
          </RNav.Item>
          <RNav.Item
            eventKey={TeaserType.Event}
            icon={<MdEvent />}
          >
            {t('resources.teaserType.event')}
          </RNav.Item>
          <RNav.Item
            eventKey={TeaserType.Custom}
            icon={<MdSettings />}
          >
            {t('resources.teaserType.custom')}
          </RNav.Item>
        </Nav>

        {type === TeaserType.Event &&
          !isEventListLoading &&
          events.length !== 0 && (
            <EventFilterContainer>
              <ToggleLabel>{t('event.list.upcomingOnly')}</ToggleLabel>
              <Toggle
                checked={eventFilter}
                onChange={value => setEventFilter(value)}
              />
            </EventFilterContainer>
          )}

        {type !== TeaserType.Custom && type !== TeaserType.Event && (
          <InputGroup>
            <Input
              value={filter.title || ''}
              onChange={value => updateFilter(value as string)}
            />
            <RInputGroup.Addon>
              <MdSearch />
            </RInputGroup.Addon>
          </InputGroup>
        )}

        <List>{currentContent()}</List>
      </Drawer.Body>
    </>
  );
}
