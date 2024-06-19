import {ApolloError} from '@apollo/client'
import styled from '@emotion/styled'
import {SortOrder, Tag, TagSort, TagType, useTagListQuery} from '@wepublish/editor/api'
import {useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {Divider as RDivider, Message, Pagination as RPagination, TagPicker, toaster} from 'rsuite'

import {DEFAULT_MAX_TABLE_PAGES} from '../../utility'
import {ItemDataType} from 'rsuite/esm/@types/common'

const Divider = styled(RDivider)`
  margin: '12px 0';
`

const Pagination = styled(RPagination)`
  margin: 0 12px 12px;
`

interface SelectTagsProps {
  className?: string
  disabled?: boolean
  name?: string
  tagType: TagType
  defaultTags: Pick<Tag, 'id' | 'tag'>[]
  selectedTags?: string[] | null
  setSelectedTags(tags: string[]): void
}

export function SelectTags({
  className,
  disabled,
  name,
  defaultTags,
  tagType,
  selectedTags,
  setSelectedTags
}: SelectTagsProps) {
  const {t} = useTranslation()
  const [page, setPage] = useState(1)
  const [cacheData, setCacheData] = useState(
    defaultTags.map(tag => ({
      label: tag.tag || t('comments.edit.unnamedTag'),
      value: tag.id
    })) as ItemDataType<string | number>[]
  )

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
  const {data: tagsData, refetch} = useTagListQuery({
    variables: {
      filter: {
        type: tagType
      },
      sort: TagSort.Tag,
      order: SortOrder.Ascending,
      take: 50
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
  }, [tagsData, t])

  return (
    <TagPicker
      block
      virtualized
      disabled={disabled}
      className={className}
      name={name}
      value={selectedTags}
      data={availableTags}
      cacheData={cacheData}
      onSearch={word => {
        refetch({
          filter: {
            tag: word,
            type: tagType
          }
        })
      }}
      onSelect={(value, item, event) => {
        setCacheData([...cacheData, item])
        refetch({
          filter: {
            type: tagType
          }
        })
      }}
      onChange={(value, item) => {
        setSelectedTags(value)
      }}
      renderMenu={menu => {
        return (
          <>
            {menu}

            <Divider />

            <Pagination
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
