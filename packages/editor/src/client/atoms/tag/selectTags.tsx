import {ApolloError} from '@apollo/client'
import React, {useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Divider, Message, Pagination, TagPicker, toaster} from 'rsuite'

import {SortOrder, TagSort, TagType, useTagListQuery} from '../../api'
import {DEFAULT_MAX_TABLE_PAGES} from '../../utility'

interface SelectTagsProps {
  name?: string
  tagType: TagType
  selectedTags?: string[] | null
  setSelectedTags(tags: string[]): void
}

export function SelectTags({name, tagType, selectedTags, setSelectedTags}: SelectTagsProps) {
  const {t} = useTranslation()
  const [page, setPage] = useState(1)

  /**
   * Error handling
   * @param error
   */
  const showErrors = (error: ApolloError): void => {
    toaster.push(
      <Message type="error" showIcon closable duration={3000}>
        {error.message}
      </Message>
    )
  }

  /**
   * Loading tags
   */
  const {data: tagsData} = useTagListQuery({
    variables: {
      filter: {
        type: tagType
      },
      sort: TagSort.Tag,
      order: SortOrder.Ascending
    },
    fetchPolicy: 'no-cache',
    onError: showErrors
  })

  /**
   * Prepare available tags
   */
  const availableTags = useMemo(() => {
    if (!tagsData?.tags?.nodes) {
      return []
    }

    return tagsData.tags.nodes.map(tag => ({
      label: tag.tag || t('comments.edit.unnamedTag'),
      value: tag.id
    }))
  }, [tagsData])

  return (
    <TagPicker
      block
      virtualized
      name={name}
      value={selectedTags}
      data={availableTags}
      onChange={(value: string[]) => setSelectedTags(value)}
      renderMenu={menu => {
        return (
          <>
            {menu}

            <Divider style={{margin: '12px 0'}} />

            <Pagination
              style={{
                padding: '0 12px 12px'
              }}
              limit={50}
              maxButtons={DEFAULT_MAX_TABLE_PAGES}
              first
              last
              prev
              next
              ellipsis
              boundaryLinks
              layout={['total', '-', '|', 'pager']}
              total={tagsData?.tags?.totalCount ?? 0}
              activePage={page}
              onChangePage={page => setPage(page)}
            />
          </>
        )
      }}
    />
  )
}
