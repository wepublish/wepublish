import React, {useState, useEffect} from 'react'

import {Button, Drawer, Form, Panel, Input, SelectPicker, toaster, Message} from 'rsuite'

import {
  useCreateNavigationMutation,
  useNavigationQuery,
  useUpdateNavigationMutation,
  FullNavigationFragment,
  NavigationListDocument,
  NavigationLinkInput,
  usePageListQuery,
  PageRefFragment,
  useArticleListQuery,
  ArticleRefFragment
} from '../api'

import {useTranslation} from 'react-i18next'
import {generateID, getOperationNameFromDocument} from '../utility'
import {ListInput, ListValue} from '../atoms/listInput'

export interface NavigationEditPanelProps {
  id?: string

  onClose?(): void
  onSave?(navigation: FullNavigationFragment): void
}

export interface NavigationLink {
  label: string
  type: string
  articleID?: string
  pageID?: string
  url?: string
}

export function NavigationEditPanel({id, onClose, onSave}: NavigationEditPanelProps) {
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [navigationLinks, setNavigationLinks] = useState<ListValue<NavigationLink>[]>([])
  const [pages, setPages] = useState<PageRefFragment[]>([])
  const [articles, setArticles] = useState<ArticleRefFragment[]>([])

  const linkTypes = [
    {label: 'Article', value: 'ArticleNavigationLink'},
    {label: 'Page', value: 'PageNavigationLink'},
    {label: 'External Link', value: 'ExternalNavigationLink'}
  ]

  const {data, loading: isLoading, error: loadError} = useNavigationQuery({
    variables: {id: id!},
    fetchPolicy: 'network-only',
    skip: id === undefined
  })

  const {data: pageData, loading: isLoadingPageData, error: pageLoadError} = usePageListQuery({
    variables: {first: 50},
    fetchPolicy: 'no-cache'
  })

  const {
    data: articleData,
    loading: isLoadingArticleData,
    error: articleLoadError
  } = useArticleListQuery({
    variables: {first: 50},
    fetchPolicy: 'no-cache'
  })

  const [createNavigation, {loading: isCreating, error: createError}] = useCreateNavigationMutation(
    {
      refetchQueries: [getOperationNameFromDocument(NavigationListDocument)]
    }
  )

  const [
    updateNavigation,
    {loading: isUpdating, error: updateError}
  ] = useUpdateNavigationMutation()

  const isDisabled =
    isLoading ||
    isCreating ||
    isUpdating ||
    isLoadingPageData ||
    loadError !== undefined ||
    pageLoadError !== undefined ||
    isLoadingArticleData ||
    articleLoadError !== undefined

  const {t} = useTranslation()

  useEffect(() => {
    if (data?.navigation) {
      setName(data.navigation.name)
      setKey(data.navigation.key)
      setNavigationLinks(
        data.navigation.links
          ? data.navigation.links.map(link => {
              return {
                id: generateID(),
                value: {
                  label: link.label,
                  type: link.__typename,
                  articleID:
                    link.__typename === 'ArticleNavigationLink' ? link.article?.id : undefined,
                  pageID: link.__typename === 'PageNavigationLink' ? link.page?.id : undefined,
                  url: link.__typename === 'ExternalNavigationLink' ? link.url : undefined
                }
              }
            })
          : []
      )
    }
  }, [data?.navigation])

  useEffect(() => {
    if (pageData?.pages?.nodes) {
      setPages(pageData.pages.nodes)
    }
  }, [pageData?.pages])

  useEffect(() => {
    if (articleData?.articles.nodes) {
      setArticles(articleData.articles.nodes)
    }
  }, [articleData?.articles])

  useEffect(() => {
    const error =
      loadError?.message ??
      createError?.message ??
      updateError?.message ??
      pageLoadError?.message ??
      articleLoadError?.message
    if (error)
      toaster.push(
        <Message type="error" showIcon closable duration={0}>
          {error}
        </Message>
      )
  }, [loadError, createError, updateError, articleLoadError, pageLoadError])

  function unionForNavigationLink(item: ListValue<NavigationLink>): NavigationLinkInput {
    const link = item.value
    switch (link.type) {
      case 'ArticleNavigationLink':
        return {
          article: {
            label: link.label,
            articleID: link.articleID!
          }
        }
      case 'PageNavigationLink':
        return {
          page: {
            label: link.label,
            pageID: link.pageID!
          }
        }
      case 'ExternalNavigationLink':
        return {
          external: {
            label: link.label,
            url: link.url!
          }
        }
      default:
        throw new Error('Type does not exist')
    }
  }

  async function handleSave() {
    if (id) {
      const {data} = await updateNavigation({
        variables: {
          id,
          input: {
            name,
            key,
            links: navigationLinks.map(unionForNavigationLink)
          }
        }
      })

      if (data?.updateNavigation) onSave?.(data.updateNavigation)
    } else {
      const {data} = await createNavigation({
        variables: {
          input: {
            name,
            key,
            links: navigationLinks.map(unionForNavigationLink)
          }
        }
      })

      if (data?.createNavigation) onSave?.(data.createNavigation)
    }
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>
          {id ? t('navigation.panels.editNavigation') : t('navigation.panels.createNavigation')}
        </Drawer.Title>

        <Drawer.Actions>
          <Button appearance="primary" disabled={isDisabled} onClick={() => handleSave()}>
            {id ? t('navigation.panels.save') : t('navigation.panels.create')}
          </Button>
          <Button appearance={'subtle'} onClick={() => onClose?.()}>
            {t('navigation.panels.close')}
          </Button>
        </Drawer.Actions>
      </Drawer.Header>
      <Drawer.Body>
        <Panel>
          <Form fluid>
            <Form.Group>
              <Form.ControlLabel>{t('navigation.panels.name')}</Form.ControlLabel>
              <Form.Control
                name="name"
                placeholder={t('navigation.panels.name')}
                value={name}
                disabled={isDisabled}
                onChange={(value: string) => {
                  setName(value)
                }}
              />
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>{t('navigation.panels.key')}</Form.ControlLabel>
              <Form.Control
                name="key"
                placeholder={t('navigation.panels.key')}
                value={key}
                disabled={isDisabled}
                onChange={(value: string) => {
                  setKey(value)
                }}
              />
            </Form.Group>
          </Form>
        </Panel>
        <Panel header={t('authors.panels.links')}>
          <ListInput
            value={navigationLinks}
            onChange={navigationLinkInput => setNavigationLinks(navigationLinkInput)}
            defaultValue={{label: '', url: '', type: 'ExternalNavigationLink'}}>
            {({value, onChange}) => (
              <>
                <Input
                  placeholder={t('navigation.panels.label')}
                  value={value.label}
                  style={{marginBottom: 4}}
                  onChange={label => {
                    onChange({...value, label})
                  }}
                />
                <SelectPicker
                  block
                  virtualized
                  value={value.type}
                  style={{marginBottom: 4}}
                  data={linkTypes}
                  onChange={(type: string) => {
                    if (!type) return
                    onChange({...value, type})
                  }}
                />
                {value.type === 'PageNavigationLink' || value.type === 'ArticleNavigationLink' ? (
                  <SelectPicker
                    block
                    virtualized
                    placeholder={
                      value.type === 'PageNavigationLink'
                        ? t('navigation.panels.selectPage')
                        : t('navigation.panels.selectArticle')
                    }
                    value={value.type === 'PageNavigationLink' ? value.pageID : value.articleID}
                    data={
                      value.type === 'PageNavigationLink'
                        ? pages.map(page => ({value: page.id!, label: page.latest.title}))
                        : articles.map(article => ({
                            value: article.id!,
                            label: article.latest.title
                          }))
                    }
                    onChange={chosenReferenceID => {
                      if (!chosenReferenceID) return
                      if (value.type === 'PageNavigationLink') {
                        onChange({...value, pageID: chosenReferenceID})
                      } else {
                        onChange({...value, articleID: chosenReferenceID})
                      }
                    }}
                  />
                ) : (
                  <Input
                    placeholder={t('navigation.panels.url')}
                    style={{marginBottom: 8}}
                    value={value.url}
                    onChange={url =>
                      onChange({
                        ...value,
                        url
                      })
                    }
                  />
                )}
              </>
            )}
          </ListInput>
        </Panel>
      </Drawer.Body>
    </>
  )
}
