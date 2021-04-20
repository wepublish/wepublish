import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Button, Icon, List, Input, InputGroup, Notification} from 'rsuite'
import {ContentContextEnum, ContentListQuery, useContentListQuery} from '../api'
import {Reference} from '../interfaces/referenceType'

export interface RefContentSelectPanelProps {
  readonly type: string
  readonly context: ContentContextEnum
  onSelectRef: (ref: Reference) => void
}

export function RefContentSelectPanel({onSelectRef, type, context}: RefContentSelectPanelProps) {
  const [filter, setFilter] = useState('')

  const listVariables: {
    type: any
    context: ContentContextEnum
    filter: string | undefined
    first: number
  } = {
    type: type,
    context: context,
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
                    contentType: type,
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
      <InputGroup style={{marginBottom: 20}}>
        <InputGroup.Addon>
          <Icon icon="search" />
        </InputGroup.Addon>
        <Input value={filter} onChange={value => setFilter(value)} />
      </InputGroup>
      <List>{currentContent()}</List>
    </>
  )
}
