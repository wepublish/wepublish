import styled from '@emotion/styled';
import {
  ArticleWithoutBlocksFragment,
  FullNavigationFragment,
  NavigationLinkInput,
  NavigationLinkType,
  NavigationListDocument,
  PageWithoutBlocksFragment,
  useArticleListQuery,
  useCreateNavigationMutation,
  useNavigationQuery,
  usePageListQuery,
  useUpdateNavigationMutation,
} from '@wepublish/editor/api';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Drawer,
  Form,
  Input as RInput,
  Message,
  Panel,
  SelectPicker as RSelectPicker,
  toaster,
} from 'rsuite';

import {
  createCheckedPermissionComponent,
  ListInput,
  ListValue,
  PermissionControl,
  useAuthorisation,
} from '../atoms';
import { generateID, getOperationNameFromDocument } from '../utility';

const SelectPicker = styled(RSelectPicker)`
  margin-bottom: 4px;
`;

const Input = styled(RInput)`
  margin-bottom: 8px;
`;

export interface NavigationEditPanelProps {
  id?: string;

  onClose?(): void;
  onSave?(navigation: FullNavigationFragment): void;
}

export interface NavigationLink {
  label: string;
  type: string;
  articleID?: string | null;
  pageID?: string | null;
  url?: string | null;
}

function NavigationEditPanel({
  id,
  onClose,
  onSave,
}: NavigationEditPanelProps) {
  const isAuthorized = useAuthorisation('CAN_CREATE_NAVIGATION');
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [navigationLinks, setNavigationLinks] = useState<
    ListValue<NavigationLink>[]
  >([]);
  const [pages, setPages] = useState<PageWithoutBlocksFragment[]>([]);
  const [articles, setArticles] = useState<ArticleWithoutBlocksFragment[]>([]);

  const linkTypes = [
    { label: 'Article', value: 'ArticleNavigationLink' },
    { label: 'Page', value: 'PageNavigationLink' },
    { label: 'External Link', value: 'ExternalNavigationLink' },
  ];

  const {
    data,
    loading: isLoading,
    error: loadError,
  } = useNavigationQuery({
    variables: { id: id! },
    fetchPolicy: 'cache-and-network',
    skip: id === undefined,
  });

  const {
    data: pageData,
    loading: isLoadingPageData,
    error: pageLoadError,
  } = usePageListQuery({
    variables: { take: 50 },
    fetchPolicy: 'cache-and-network',
  });

  const {
    data: articleData,
    loading: isLoadingArticleData,
    error: articleLoadError,
  } = useArticleListQuery({
    variables: { take: 50 },
    fetchPolicy: 'cache-and-network',
  });

  const [createNavigation, { loading: isCreating, error: createError }] =
    useCreateNavigationMutation({
      refetchQueries: [getOperationNameFromDocument(NavigationListDocument)],
    });

  const [updateNavigation, { loading: isUpdating, error: updateError }] =
    useUpdateNavigationMutation();

  const isDisabled =
    isLoading ||
    isCreating ||
    isUpdating ||
    isLoadingPageData ||
    loadError !== undefined ||
    pageLoadError !== undefined ||
    isLoadingArticleData ||
    articleLoadError !== undefined ||
    !isAuthorized;

  const { t } = useTranslation();

  useEffect(() => {
    if (data?.navigation) {
      setName(data.navigation.name);
      setKey(data.navigation.key);
      setNavigationLinks(
        data.navigation.links ?
          data.navigation.links.map(link => {
            return {
              id: generateID(),
              value: {
                label: link.label,
                type: link.__typename,
                articleID:
                  link.__typename === 'ArticleNavigationLink' ?
                    link.articleID
                  : undefined,
                pageID:
                  link.__typename === 'PageNavigationLink' ?
                    link.pageID
                  : undefined,
                url:
                  link.__typename === 'ExternalNavigationLink' ?
                    link.url
                  : undefined,
              },
            };
          })
        : []
      );
    }
  }, [data?.navigation]);

  useEffect(() => {
    if (pageData?.pages?.nodes) {
      setPages(pageData.pages.nodes);
    }
  }, [pageData?.pages]);

  useEffect(() => {
    if (articleData?.articles.nodes) {
      setArticles(articleData.articles.nodes);
    }
  }, [articleData?.articles]);

  useEffect(() => {
    const error =
      loadError?.message ??
      createError?.message ??
      updateError?.message ??
      pageLoadError?.message ??
      articleLoadError?.message;
    if (error)
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={0}
        >
          {error}
        </Message>
      );
  }, [loadError, createError, updateError, articleLoadError, pageLoadError]);

  function unionForNavigationLink(
    item: ListValue<NavigationLink>
  ): NavigationLinkInput {
    const link = item.value;
    switch (link.type) {
      case 'ArticleNavigationLink':
        return {
          type: NavigationLinkType.Article,
          label: link.label,
          articleID: link.articleID!,
        };
      case 'PageNavigationLink':
        return {
          type: NavigationLinkType.Page,
          label: link.label,
          pageID: link.pageID!,
        };
      case 'ExternalNavigationLink':
        return {
          type: NavigationLinkType.External,
          label: link.label,
          url: link.url!,
        };
      default:
        throw new Error('Type does not exist');
    }
  }

  async function handleSave() {
    if (id) {
      const { data } = await updateNavigation({
        variables: {
          id,
          name,
          key,
          links: navigationLinks.map(unionForNavigationLink),
        },
      });

      if (data?.updateNavigation) onSave?.(data.updateNavigation);
    } else {
      const { data } = await createNavigation({
        variables: {
          name,
          key,
          links: navigationLinks.map(unionForNavigationLink),
        },
      });

      if (data?.createNavigation) onSave?.(data.createNavigation);
    }
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>
          {id ?
            t('navigation.panels.editNavigation')
          : t('navigation.panels.createNavigation')}
        </Drawer.Title>

        <Drawer.Actions>
          <PermissionControl qualifyingPermissions={['CAN_CREATE_NAVIGATION']}>
            <Button
              appearance="primary"
              disabled={isDisabled}
              onClick={() => handleSave()}
            >
              {id ? t('save') : t('create')}
            </Button>
          </PermissionControl>
          <Button
            appearance={'subtle'}
            onClick={() => onClose?.()}
          >
            {t('navigation.panels.close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>
      <Drawer.Body>
        <Panel>
          <Form fluid>
            <Form.Group controlId="navigationName">
              <Form.ControlLabel>
                {t('navigation.panels.name')}
              </Form.ControlLabel>
              <Form.Control
                name="name"
                placeholder={t('navigation.panels.name')}
                value={name}
                disabled={isDisabled}
                onChange={(value: string) => {
                  setName(value);
                }}
              />
            </Form.Group>
            <Form.Group controlId="navigationKey">
              <Form.ControlLabel>
                {t('navigation.panels.key')}
              </Form.ControlLabel>
              <Form.Control
                name="key"
                placeholder={t('navigation.panels.key')}
                value={key}
                disabled={isDisabled}
                onChange={(value: string) => {
                  setKey(value);
                }}
              />
            </Form.Group>
          </Form>
        </Panel>
        <Panel header={t('authors.panels.links')}>
          <ListInput
            disabled={isDisabled}
            value={navigationLinks}
            onChange={navigationLinkInput =>
              setNavigationLinks(navigationLinkInput)
            }
            defaultValue={{
              label: '',
              url: '',
              type: 'ExternalNavigationLink',
            }}
          >
            {({ value, onChange }) => (
              <>
                <Input
                  placeholder={t('navigation.panels.label')}
                  value={value.label}
                  onChange={label => {
                    onChange({ ...value, label });
                  }}
                />
                <SelectPicker
                  block
                  virtualized
                  value={value.type}
                  data={linkTypes}
                  onChange={type => {
                    if (type) {
                      onChange({ ...value, type: type as string });
                    }
                  }}
                />
                {(
                  value.type === 'PageNavigationLink' ||
                  value.type === 'ArticleNavigationLink'
                ) ?
                  <RSelectPicker
                    block
                    virtualized
                    placeholder={
                      value.type === 'PageNavigationLink' ?
                        t('navigation.panels.selectPage')
                      : t('navigation.panels.selectArticle')
                    }
                    value={
                      value.type === 'PageNavigationLink' ?
                        value.pageID
                      : value.articleID
                    }
                    data={
                      value.type === 'PageNavigationLink' ?
                        pages.map(page => ({
                          value: page.id!,
                          label: page.latest.title,
                        }))
                      : articles.map(article => ({
                          value: article.id!,
                          label: article.latest.title,
                        }))
                    }
                    onChange={chosenReferenceID => {
                      if (!chosenReferenceID) return;
                      if (value.type === 'PageNavigationLink') {
                        onChange({ ...value, pageID: chosenReferenceID });
                      } else {
                        onChange({ ...value, articleID: chosenReferenceID });
                      }
                    }}
                  />
                : <Input
                    placeholder={t('navigation.panels.url')}
                    value={value.url!}
                    onChange={url =>
                      onChange({
                        ...value,
                        url,
                      })
                    }
                  />
                }
              </>
            )}
          </ListInput>
        </Panel>
      </Drawer.Body>
    </>
  );
}
const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_NAVIGATIONS',
  'CAN_GET_NAVIGATION',
  'CAN_CREATE_NAVIGATION',
  'CAN_DELETE_NAVIGATION',
])(NavigationEditPanel);
export { CheckedPermissionComponent as NavigationEditPanel };
