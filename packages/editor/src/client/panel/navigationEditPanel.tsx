import React, {useState, useEffect} from 'react'

import {
  Panel,
  PanelHeader,
  NavigationButton,
  PanelSection,
  TextInput,
  Box,
  Spacing,
  PanelSectionHeader,
  Toast,
  Select,
  ListInput,
  ListValue
} from '@karma.run/ui'

import {MaterialIconClose, MaterialIconSaveOutlined} from '@karma.run/icons'

import {
  useCreateNavigationMutation,
  useNavigationQuery,
  useUpdateNavigationMutation,
  FullNavigationFragment,
  NavigationListDocument,
  NavigationLinkInput,
  usePageListQuery,
  PageRefFragment
} from '../api'

import {useTranslation} from 'react-i18next'
import {generateID, getOperationNameFromDocument} from '../utility'

export interface NavigationEditPanelProps {
  id?: string

  onClose?(): void
  onSave?(navigation: FullNavigationFragment): void
}

export interface LinkType {
  id: string
}

export enum LinkTypes {
  PageNavigationLink = 'page',
  ArticleNavigationLink = 'article',
  ExternalNavigationLink = 'external'
}
export interface NavigationLinkTT extends NavigationLinkInput {
  label: string
  type: LinkTypes
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

  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()

  const {data, loading: isLoading, error: loadError} = useNavigationQuery({
    variables: {id: id!},
    fetchPolicy: 'network-only',
    skip: id === undefined
  })

  const {data: pageData, loading: isLoadingPageData, error: pageDataError} = usePageListQuery({
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
    pageDataError !== undefined

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
                  pageId: link.__typename === 'PageNavigationLink' ? link.page?.id : undefined,
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
    if (loadError) {
      setErrorToastOpen(true)
      setErrorMessage(loadError.message)
    } else if (createError) {
      setErrorToastOpen(true)
      setErrorMessage(createError.message)
    } else if (updateError) {
      setErrorToastOpen(true)
      setErrorMessage(updateError.message)
    } else if (pageDataError) {
      setErrorMessage(pageDataError.message)
      setErrorToastOpen(true)
    }
  }, [loadError, createError, updateError, pageDataError])

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
      console.log('update')
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
      <Panel>
        <PanelHeader
          title={
            id ? t('navigation.panels.editNavigation') : t('navigation.panels.createNavigation')
          }
          leftChildren={
            <NavigationButton
              icon={MaterialIconClose}
              label={t('navigation.panels.close')}
              onClick={() => onClose?.()}
            />
          }
          rightChildren={
            <NavigationButton
              icon={MaterialIconSaveOutlined}
              label={id ? t('navigation.panels.save') : t('navigation.panels.create')}
              disabled={isDisabled}
              onClick={handleSave}
            />
          }
        />

        <PanelSection>
          <Box marginBottom={Spacing.ExtraSmall}>
            <TextInput
              label={t('navigation.panels.name')}
              value={name}
              disabled={isDisabled}
              onChange={e => {
                setName(e.target.value)
              }}
            />
          </Box>
          <Box marginBottom={Spacing.ExtraSmall}>
            <TextInput
              label={t('navigation.panels.key')}
              value={key}
              disabled={isDisabled}
              onChange={e => {
                setKey(e.target.value)
              }}
            />
          </Box>
        </PanelSection>
        <PanelSectionHeader title={t('navigation.panels.links')} />
        <PanelSection>
          <ListInput
            value={navigationLinks}
            onChange={navigationLinkInput => setNavigationLinks(navigationLinkInput)}
            defaultValue={{label: '', type: LinkTypes.ArticleNavigationLink}}>
            {({value, onChange}) => (
              <>
                <TextInput
                  label={t('navigation.panels.label')}
                  flexBasis="30%"
                  marginBottom={Spacing.Small}
                  value={value.label}
                  onChange={e => {
                    onChange({...value, label: e.target.value})
                  }}
                />
                <Select
                  label={t('navigation.panels.linkType')}
                  options={[
                    {id: LinkTypes.PageNavigationLink},
                    {id: LinkTypes.ArticleNavigationLink},
                    {id: LinkTypes.ExternalNavigationLink}
                  ]}
                  value={{id: value.type}}
                  renderListItem={type => type.id}
                  onChange={type => {
                    if (!type) return
                    onChange({...value, type: type.id})
                  }}
                  marginBottom={Spacing.Small}
                />
                {value.type === LinkTypes.PageNavigationLink ||
                value.type === LinkTypes.ArticleNavigationLink ? (
                  <Box>
                    <Select
                      label={
                        value.type === LinkTypes.PageNavigationLink
                          ? t('navigation.panels.selectPages')
                          : t('navigation.panels.selectArticles')
                      }
                      options={
                        value.type === LinkTypes.PageNavigationLink
                          ? pages.map(page => ({id: page.id}))
                          : []
                      }
                      value={
                        value.type === LinkTypes.PageNavigationLink
                          ? {id: value.pageID!}
                          : {id: value.articleID!}
                      }
                      renderListItem={option => option.id}
                      onChange={type => {
                        if (!type) return
                        if (value.type === LinkTypes.PageNavigationLink) {
                          onChange({...value, pageID: type.id})
                        } else {
                          onChange({...value, articleID: type.id})
                        }
                      }}
                      marginBottom={Spacing.Small}
                    />
                  </Box>
                ) : (
                  <Box display="flex" flexDirection="row">
                    <TextInput
                      label={t('navigation.panels.url')}
                      flexBasis="70%"
                      value={value.url}
                      onChange={e =>
                        onChange({
                          ...value,
                          url: e.target.value
                        })
                      }
                    />
                  </Box>
                )}
              </>
            )}
          </ListInput>
        </PanelSection>
      </Panel>
      <Toast
        type="error"
        open={isErrorToastOpen}
        autoHideDuration={5000}
        onClose={() => setErrorToastOpen(false)}>
        {errorMessage}
      </Toast>
    </>
  )
}
