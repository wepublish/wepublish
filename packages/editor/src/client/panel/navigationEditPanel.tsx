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
  NavigationLink,
  PageNavigationLink
} from '../api'

import {useTranslation} from 'react-i18next'
import {generateID, getOperationNameFromDocument} from '../utility'
import {render} from 'react-dom'

export interface NavigationEditPanelProps {
  id?: string

  onClose?(): void
  onSave?(navigation: FullNavigationFragment): void
}

export interface LinkTypeProps {
  id: string
  name: string
}

export function NavigationEditPanel({id, onClose, onSave}: NavigationEditPanelProps) {
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [links, setLinks] = useState<ListValue[]>([])
  const [currentLinkType, setCurrentLinkType] = useState<LinkTypeProps>()
  const linkTypes = [
    {id: 'PageNavigationLink', name: 'Page Link'},
    {id: 'ArticleNavigationLink', name: 'Article Link'},
    {id: 'ExternalNavigationLink', name: 'External Link'}
  ]

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
      setLinks(
        data.navigation.links
          ? data.navigation.links.map(link => ({
              id: generateID(),
              value: {
                label: link.label
              }
            }))
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

  async function handleSave() {
    if (id) {
      const {data} = await updateNavigation({
        variables: {
          id,
          input: {
            name,
            key,
            links
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
            links
          }
        }
      })

      if (data?.createNavigation) onSave?.(data.createNavigation)
    }
  }

  function secondSelectorSwitch(currentLinkType: string | undefined) {
    switch (currentLinkType) {
      case 'PageNavigationLink':
        return (
          <Box display="flex" flexDirection="row">
            <TextInput
              label={t('navigation.panels.page')}
              flexBasis="70%"
              // value={this.value.page}
              // onChange={e => onChange({...value, page: e.target.value})}
            />
          </Box>
        )
      case 'ArticleNavigationLink':
        return (
          <Box display="flex" flexDirection="row">
            <TextInput
              label={t('navigation.panels.article')}
              flexBasis="70%"
              // value={value.article}
              // onChange={e => onChange({...value, article: e.target.value})}
            />
          </Box>
        )
      case 'ExternalNavigationLink':
        return (
          <Box display="flex" flexDirection="row">
            <TextInput
              label={t('navigation.panels.url')}
              flexBasis="70%"
              // value={value.url}
              // onChange={e => onChange({...value, url: e.target.value})}
            />
          </Box>
        )
      default:
        return ''
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
            value={links}
            onChange={links => setLinks(links)}
            defaultValue={{label: '', url: ''}}>
            {({value, onChange}) => (
              <>
                <TextInput
                  label={t('navigation.panels.label')}
                  flexBasis="30%"
                  marginBottom={Spacing.Small}
                  value={value.label}
                  onChange={e => onChange({...value, label: e.target.value})}
                />
                <Select
                  label={t('navigation.panels.linkType')}
                  options={linkTypes.map(linkType => {
                    return linkType
                  })}
                  value={currentLinkType}
                  renderListItem={linkType => linkType?.name}
                  onChange={linkType => {
                    if (linkType?.id) {
                      setCurrentLinkType(linkType)
                    }
                  }}
                  marginBottom={Spacing.Small}
                />
                {secondSelectorSwitch(currentLinkType?.id)}
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
