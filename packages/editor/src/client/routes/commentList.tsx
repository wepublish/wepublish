import React, {useEffect, useState} from 'react'

// import {Link, ButtonLink} from '../route'

import {
  CommentRefFragment,
  useCommentListQuery,
  // CommentListDocument,
  // CommentListQuery,
  PageRefFragment
} from '../api'

// import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'

import {useTranslation} from 'react-i18next'
import {
  FlexboxGrid,
  Input,
  InputGroup,
  Icon,
  // IconButton,
  Table
  // Modal, Button
} from 'rsuite'
const {Column, HeaderCell, Cell} = Table

// enum ConfirmAction {
//   Delete = 'delete',
//   Unpublish = 'unpublish'
// }

const CommentsPerPage = 50

export function CommentList() {
  const [filter, setFilter] = useState('')

  const [comments, setComments] = useState<CommentRefFragment[]>([])

  const listVariables = {filter: filter || undefined, first: CommentsPerPage}
  const {data, loading: isLoading} = useCommentListQuery({
    variables: listVariables,
    fetchPolicy: 'network-only'
  })
  const {t} = useTranslation()

  console.log('Data:', data)

  useEffect(() => {
    if (data?.comments.nodes) {
      setComments(data.comments.nodes)
    }
  }, [data?.comments])

  // function loadMore() {
  //   fetchMore({
  //     variables: {...listVariables, after: data?.comments.pageInfo.endCursor},
  //     updateQuery: (prev, {fetchMoreResult}) => {
  //       if (!fetchMoreResult) return prev

  //       return {
  //         comments: {
  //           ...fetchMoreResult.comments,
  //           nodes: [...prev.comments.nodes, ...fetchMoreResult?.comments.nodes]
  //         }
  //       }
  //     }
  //   })
  // }

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('comments.overview.comments')}</h2>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={24} style={{marginTop: '20px'}}>
          <InputGroup>
            <Input value={filter} onChange={value => setFilter(value)} />
            <InputGroup.Addon>
              <Icon icon="search" />
            </InputGroup.Addon>
          </InputGroup>
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <Table autoHeight={true} style={{marginTop: '20px'}} loading={isLoading} data={comments}>
        <Column width={100} align="left" resizable>
          <HeaderCell>{t('comments.overview.created')}</HeaderCell>
          <Cell dataKey="createdAt" />
        </Column>
        <Column width={100} align="left" resizable>
          <HeaderCell>{t('comments.overview.updated')}</HeaderCell>
          <Cell dataKey="modifiedAt" />
        </Column>
        <Column width={100} align="left" resizable>
          <HeaderCell>{t('comments.overview.states')}</HeaderCell>
          <Cell>
            {(rowData: PageRefFragment) => {
              const states = []

              if (rowData.draft) states.push(t('comments.overview.draft'))
              if (rowData.pending) states.push(t('comments.overview.pending'))
              if (rowData.published) states.push(t('comments.overview.published'))

              return <div>{states.join(' / ')}</div>
            }}
          </Cell>
        </Column>
        <Column width={100} align="center" fixed="right">
          <HeaderCell>{t('comments.overview.action')}</HeaderCell>
          <Cell style={{padding: '6px 0'}}>
            {(rowData: Comment) => (
              <>
                {JSON.stringify(rowData)}
                {/* {rowData.published && (
                  <IconButton
                    icon={<Icon icon="arrow-circle-o-down" />}
                    circle
                    size="sm"
                    onClick={e => {
                      setCurrentComment(rowData)
                      setConfirmAction(ConfirmAction.Unpublish)
                      setConfirmationDialogOpen(true)
                    }}
                  />
                )} */}
                {/* <IconButton
                  icon={<Icon icon="trash" />}
                  circle
                  size="sm"
                  style={{marginLeft: '5px'}}
                  onClick={() => {
                    setCurrentComment(rowData)
                    setConfirmAction(ConfirmAction.Delete)
                    setConfirmationDialogOpen(true)
                  }}
                /> */}
              </>
            )}
          </Cell>
        </Column>
      </Table>

      {/* {data?.comments.pageInfo.hasNextPage && (
        <Button label={t('comments.overview.loadMore')} onClick={loadMore} />
      )} */}
    </>
  )
}
