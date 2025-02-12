import {ApolloError} from '@apollo/client'
import styled from '@emotion/styled'
import {getApiClientV2, PageSort, SortOrder, usePageListQuery} from '@wepublish/editor/api-v2'
import {useMemo, useState} from 'react'
import {
  Divider as RDivider,
  Message,
  Pagination as RPagination,
  toaster,
  SelectPicker
} from 'rsuite'

import {DEFAULT_MAX_TABLE_PAGES} from '../../utility'

const Divider = styled(RDivider)`
  margin: '12px 0';
`

const Pagination = styled(RPagination)`
  margin: 0 12px 12px;
`

interface SelectPageProps {
  className?: string
  disabled?: boolean
  name?: string
  selectedPage?: string | null
  setSelectedPage(page: string | null): void
}

export function SelectPage({
  className,
  disabled,
  name,
  selectedPage,
  setSelectedPage
}: SelectPageProps) {
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
   * Loading page
   */
  const client = getApiClientV2()
  const {data: pageData, refetch} = usePageListQuery({
    client,
    variables: {
      sort: PageSort.PublishedAt,
      order: SortOrder.Ascending,
      take: 50
    },
    fetchPolicy: 'no-cache',
    onError: showErrors
  })

  /**
   * Prepare available page
   */
  const availablePages = useMemo(() => {
    if (!pageData?.pages?.nodes) {
      return []
    }

    return pageData.pages.nodes.map(page => ({
      label: page.latest.title,
      value: page.id
    }))
  }, [pageData])

  return (
    <SelectPicker
      block
      virtualized
      disabled={disabled}
      className={className}
      name={name}
      value={selectedPage}
      data={availablePages}
      onSearch={word => {
        refetch({
          filter: {
            title: word
          }
        })
      }}
      onChange={(value, item) => setSelectedPage(value)}
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
              total={pageData?.pages?.totalCount ?? 0}
              activePage={page}
              onChangePage={page => setPage(page)}
            />
          </>
        )
      }}
    />
  )
}
