import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Icon, Drawer, Nav, List, Input, InputGroup, Notification} from 'rsuite'
import {ContentContextEnum, ContentListQuery, ContentTypeEnum, useContentListQuery} from '../api'
import {Reference} from '@wepublish/editor'

export interface RefType {
  type: ContentTypeEnum
  context: ContentContextEnum
}

export interface TeaserSelectPanelProps {
  readonly types: RefType[]
  onClose(): void
  onSelectRef: (ref: Reference) => void
}

export function RefSelectPanel({onClose, onSelectRef, types}: TeaserSelectPanelProps) {
  const [tabIndex, setTabIndex] = useState(0)
  const [filter, setFilter] = useState('')

  const currentType = types[tabIndex]
  const listVariables: {
    type: ContentTypeEnum
    context: ContentContextEnum
    filter: string | undefined
    first: number
  } = {
    type: currentType.type,
    context: currentType.context,
    filter: filter || undefined,
    first: 20
  }

  const {data, fetchMore, error} = useContentListQuery({
    variables: listVariables,
    fetchPolicy: 'network-only'
  })

  const {t} = useTranslation()

  useEffect(() => {
    if (error) {
      Notification.error({
        title: error?.message,
        duration: 5000
      })
    }
  }, [error])

  function loadMoreArticles() {
    fetchMore({
      variables: {...listVariables, after: data?.content._all.list.pageInfo.endCursor},
      updateQuery: (prev, {fetchMoreResult}) => {
        if (!fetchMoreResult) return prev

        return {
          content: {
            _all: {
              list: {
                ...(fetchMoreResult as ContentListQuery).content._all.list,
                nodes: [
                  ...(prev as ContentListQuery).content._all.list.nodes,
                  ...(fetchMoreResult as ContentListQuery)?.content._all.list.nodes
                ]
              }
            }
          }
        }
      }
    })
  }

  const tabs = types.map((type, index) => {
    return (
      <Nav.Item key={index} eventKey={index} icon={<Icon icon="file-text" />}>
        {type.type}
      </Nav.Item>
    )
  })

  function currentContent() {
    return (
      <>
        {data?.content._all.list.nodes.map(node => {
          const {content, peer} = node
          const states = []

          if (content.state) states.push(t('articleEditor.panels.draft'))
          // if (content.pending) states.push(t('articleEditor.panels.pending'))
          // if (content.published) states.push(t('articleEditor.panels.published'))

          return (
            <List.Item key={content.id}>
              <h3
                style={{cursor: 'pointer'}}
                onClick={() =>
                  onSelectRef({
                    contentType: currentType.type,
                    recordId: content.id,
                    peerId: peer?.id
                  })
                }>
                {content.title || t('articleEditor.panels.untitled')}
              </h3>
              <div>
                <div style={{display: 'inline', fontSize: 12}}>
                  {new Date(content.createdAt).toLocaleString()}
                </div>
                <div style={{display: 'inline', fontSize: 12, marginLeft: 8}}>
                  {new Date(content.modifiedAt).toLocaleString()}
                </div>
                <div style={{display: 'inline', fontSize: 12, marginLeft: 8}}>
                  {states.join(' / ')}
                </div>
              </div>
            </List.Item>
          )
        })}
        {data?.content._all.list.pageInfo.hasNextPage && (
          <Button onClick={loadMoreArticles}>{t('articleEditor.panels.loadMore')}</Button>
        )}
      </>
    )
  }

  return (
    <>
      <Drawer.Header>
        <Drawer.Title>Choose a reference</Drawer.Title>
      </Drawer.Header>

      <Drawer.Body>
        <Nav
          appearance="tabs"
          activeKey={tabIndex}
          onSelect={tabIndex => setTabIndex(tabIndex)}
          style={{marginBottom: 20}}>
          {tabs}
        </Nav>

        <InputGroup style={{marginBottom: 20}}>
          <Input value={filter} onChange={value => setFilter(value)} />
          <InputGroup.Addon>
            <Icon icon="search" />
          </InputGroup.Addon>
        </InputGroup>
        <List>{currentContent()}</List>
      </Drawer.Body>

      <Drawer.Footer>
        <Button appearance={'subtle'} onClick={() => onClose?.()}>
          {t('articleEditor.panels.close')}
        </Button>
      </Drawer.Footer>
    </>
  )
}
