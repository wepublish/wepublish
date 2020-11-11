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
  NavigationLinkInput
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
  label: string | undefined
  type: LinkTypes | undefined
}
export function NavigationEditPanel({id, onClose, onSave}: NavigationEditPanelProps) {
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [navigationLinkInput, setNavigationLinkInput] = useState<ListValue<NavigationLinkTT>[]>([])

  const [isErrorToastOpen, setErrorToastOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()

  const {data, loading: isLoading, error: loadError} = useNavigationQuery({
    variables: {id: id!},
    fetchPolicy: 'network-only',
    skip: id === undefined
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

  const isDisabled = isLoading || isCreating || isUpdating || loadError !== undefined

  const {t} = useTranslation()

  useEffect(() => {
    if (data?.navigation) {
      setName(data.navigation.name)
      setKey(data.navigation.key)
      setNavigationLinkInput(
        data.navigation.links
          ? data.navigation.links.map(link => {
              return {
                id: generateID(),
                value: {
                  label: link.label,
                  type:
                    link.__typename === 'PageNavigationLink'
                      ? LinkTypes.PageNavigationLink
                      : link.__typename === 'ArticleNavigationLink'
                      ? LinkTypes.ArticleNavigationLink
                      : link.__typename === 'ExternalNavigationLink'
                      ? LinkTypes.ExternalNavigationLink
                      : LinkTypes.ArticleNavigationLink,

                  ...(link.__typename === 'PageNavigationLink'
                    ? {page: {label: link.label, pageID: link.page?.id ? link.page.id : ''}}
                    : {}),
                  ...(link.__typename === 'ArticleNavigationLink'
                    ? {
                        article: {
                          label: link.label,
                          articleID: link.article?.id ? link.article?.id : ''
                        }
                      }
                    : {}),
                  ...(link.__typename === 'ExternalNavigationLink'
                    ? {external: {label: link.label, url: link.url}}
                    : {})
                }
              }
            })
          : []
      )
    }
  }, [data?.navigation])

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
    }
  }, [loadError, createError, updateError])

  function cleanNavigationLinkInput(value: NavigationLinkTT): NavigationLinkInput {
    if (value.type === 'page') {
      value = {
        ...value,
        page: {
          label: value.label ? value.label : '',
          pageID: value.page?.pageID ? value.page.pageID : ''
        },
        external: undefined,
        article: undefined
      }
    } else if (value.type === 'article') {
      value = {
        ...value,
        article: {
          label: value.label ? value.label : '',
          articleID: value.article?.articleID ? value.article.articleID : ''
        },
        external: undefined,
        page: undefined
      }
    } else if (value.type === 'external') {
      value = {
        ...value,
        external: {
          label: value.label ? value.label : '',
          url: value.external?.url ? value.external?.url : ''
        },
        article: undefined,
        page: undefined
      }
    } else {
      console.log('Error: LinkType not defined')
    }
    ;[value.label, value.type] = [undefined, undefined]
    return value
  }

  async function handleSave() {
    if (id) {
      const {data} = await updateNavigation({
        variables: {
          id,
          input: {
            name,
            key,
            links: navigationLinkInput.map(({value}) => cleanNavigationLinkInput(value))
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
            links: navigationLinkInput.map(({value}) => value)
          }
        }
      })

      if (data?.createNavigation) onSave?.(data.createNavigation)
    }
  }

  const renderLinkTypes = (value: {id: LinkTypes}) => {
    switch (value.id) {
      case LinkTypes.ArticleNavigationLink:
        return 'Article Link'
      case LinkTypes.PageNavigationLink:
        return 'Page Link'
      case LinkTypes.ExternalNavigationLink:
        return 'External Link'
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
            value={navigationLinkInput}
            onChange={navigationLinkInput => setNavigationLinkInput(navigationLinkInput)}
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
                    {...value, id: LinkTypes.PageNavigationLink},
                    {...value, id: LinkTypes.ArticleNavigationLink},
                    {...value, id: LinkTypes.ExternalNavigationLink}
                  ]}
                  value={{...value, id: value.type ? value.type : LinkTypes.ArticleNavigationLink}}
                  renderListItem={renderLinkTypes}
                  onChange={e => {
                    onChange({
                      ...value,
                      type: e!.id,
                      page: {pageID: '', label: value.label ? value.label : ''},
                      article: {articleID: '', label: value.label ? value.label : ''},
                      external: {url: '', label: value.label ? value.label : ''}
                    })
                  }}
                  marginBottom={Spacing.Small}
                />
                {(value => {
                  switch (value.type) {
                    case LinkTypes.PageNavigationLink:
                      return (
                        <Box display="flex" flexDirection="row">
                          <TextInput
                            label={t('navigation.panels.page')}
                            flexBasis="70%"
                            value={value.page?.pageID}
                            onChange={e =>
                              onChange({
                                ...value,
                                page: {
                                  label: value.label ? value.label : '',
                                  pageID: e.target.value
                                }
                              })
                            }
                          />
                        </Box>
                      )
                    case LinkTypes.ArticleNavigationLink:
                      return (
                        <Box display="flex" flexDirection="row">
                          <TextInput
                            label={t('navigation.panels.article')}
                            flexBasis="70%"
                            value={value.article?.articleID}
                            onChange={e =>
                              onChange({
                                ...value,
                                article: {
                                  label: value.label ? value.label : '',
                                  articleID: e.target.value
                                }
                              })
                            }
                          />
                        </Box>
                      )
                    case LinkTypes.ExternalNavigationLink:
                      return (
                        <Box display="flex" flexDirection="row">
                          <TextInput
                            label={t('navigation.panels.url')}
                            flexBasis="70%"
                            value={value.external?.url}
                            onChange={e =>
                              onChange({
                                ...value,
                                external: {
                                  label: value.label ? value.label : '',
                                  url: e.target.value
                                }
                              })
                            }
                          />
                        </Box>
                      )
                    default:
                      return ''
                  }
                })(value)}
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
