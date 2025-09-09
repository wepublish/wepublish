import {ApolloError} from '@apollo/client'
import styled from '@emotion/styled'
import {
  Tag,
  TagType,
  useCreateTagMutation,
  useDeleteTagMutation,
  useTagListLazyQuery,
  useUpdateTagMutation
} from '@wepublish/editor/api'
import {
  createCheckedPermissionComponent,
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  IconButton,
  IconButtonTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
  Table,
  TableWrapper
} from '@wepublish/ui/editor'
import {equals} from 'ramda'
import {memo, useCallback, useEffect, useReducer, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdAdd, MdDelete, MdEdit, MdSave} from 'react-icons/md'
import {
  Button,
  Checkbox,
  FlexboxGrid,
  Form,
  IconButton as RIconButton,
  Input,
  Loader as RLoader,
  Message,
  Modal,
  Pagination,
  Table as RTable,
  Tag as RTag,
  toaster
} from 'rsuite'

const {Column, HeaderCell, Cell} = RTable

const Loader = styled(RLoader)`
  margin: 30px;
`

export type TagListProps = {
  type: TagType
}

enum TagListActionType {
  Set = 'set',
  Create = 'create',
  Update = 'update',
  Delete = 'delete'
}

type TagListActions =
  | {type: TagListActionType.Set; payload: Record<string, Pick<Tag, 'tag' | 'main'>>}
  | {type: TagListActionType.Create; payload: {id: string}}
  | {type: TagListActionType.Update; payload: {id: string; tag?: string | null; main?: boolean}}
  | {type: TagListActionType.Delete; payload: {id: string}}

const mapTagsToFormValue = <T extends Pick<Tag, 'id' | 'main' | 'tag'>>(
  tags: T[] | null | undefined
) =>
  tags?.reduce((obj, node) => {
    obj[node.id] = {
      main: node.main,
      tag: node.tag ?? ''
    }

    return obj
  }, {} as Record<string, Pick<Tag, 'tag' | 'main'>>) ?? {}

const tagFormValueReducer = (
  state: Record<string, Pick<Tag, 'tag' | 'main'>>,
  action: TagListActions
): Record<string, Pick<Tag, 'tag' | 'main'>> => {
  switch (action.type) {
    case TagListActionType.Set:
      return action.payload

    case TagListActionType.Create:
      return {
        [action.payload.id]: {
          main: false,
          tag: ''
        },
        ...state
      }

    case TagListActionType.Update: {
      const newState = {...state}

      newState[action.payload.id] = {
        tag: action.payload.tag ?? newState[action.payload.id].tag,
        main: action.payload.main ?? newState[action.payload.id].main
      }

      return newState
    }

    case TagListActionType.Delete: {
      const newState = {...state}
      delete newState[action.payload.id]

      return newState
    }
  }

  return state
}

const showErrors = (error: ApolloError): void => {
  toaster.push(
    <Message type="error" showIcon closable duration={3000}>
      {error.message}
    </Message>
  )
}

const TagList = memo<TagListProps>(({type}) => {
  const {t} = useTranslation()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [formValue, dispatchFormValue] = useReducer(tagFormValueReducer, {})
  const [apiValue, dispatchApiValue] = useReducer(tagFormValueReducer, {})
  const [tagToDelete, setTagToDelete] = useState<string | null>(null)

  const [fetch, {data, loading}] = useTagListLazyQuery({
    variables: {
      take: limit,
      filter: {
        type
      }
    },
    fetchPolicy: 'cache-and-network',
    onError: showErrors,
    onCompleted(newData) {
      dispatchApiValue({
        type: TagListActionType.Set,
        payload: mapTagsToFormValue(newData?.tags?.nodes)
      })

      dispatchFormValue({
        type: TagListActionType.Set,
        payload: mapTagsToFormValue(newData?.tags?.nodes)
      })
    }
  })

  const [createTag] = useCreateTagMutation({
    variables: {
      type
    },
    onError: showErrors,
    onCompleted(createdTag) {
      if (!createdTag.createTag) {
        return
      }

      dispatchApiValue({
        type: TagListActionType.Create,
        payload: {
          id: createdTag.createTag.id
        }
      })

      dispatchFormValue({
        type: TagListActionType.Create,
        payload: {
          id: createdTag.createTag.id
        }
      })
    }
  })
  const [updateTag] = useUpdateTagMutation({
    onError: showErrors,
    onCompleted(updatedTag) {
      if (!updatedTag.updateTag) {
        return
      }

      dispatchApiValue({
        type: TagListActionType.Update,
        payload: updatedTag.updateTag
      })
    }
  })
  const [deleteTag] = useDeleteTagMutation({
    onError: showErrors,
    onCompleted(deletedTag) {
      if (!deletedTag.deleteTag) {
        return
      }

      dispatchApiValue({
        type: TagListActionType.Delete,
        payload: {
          id: deletedTag.deleteTag.id
        }
      })

      dispatchFormValue({
        type: TagListActionType.Delete,
        payload: {
          id: deletedTag.deleteTag.id
        }
      })
    }
  })

  const shouldUpdateTag = useCallback(
    (id: string) => {
      const apiTag = apiValue[id]
      const formTag = formValue[id]

      return !equals(apiTag, formTag)
    },
    [apiValue, formValue]
  )

  const total =
    data?.tags?.totalCount && data.tags.totalCount > Object.keys(apiValue).length
      ? data.tags.totalCount
      : Object.keys(apiValue).length

  useEffect(() => {
    fetch({
      variables: {
        take: limit,
        skip: (page - 1) * limit,
        filter: {
          type
        }
      }
    })
  }, [type, limit, page, fetch])

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('tags.overview.title')}</h2>
        </ListViewHeader>

        <PermissionControl qualifyingPermissions={['CAN_CREATE_TAG']}>
          <ListViewActions>
            <RIconButton
              type="button"
              appearance="primary"
              data-testid="create"
              icon={<MdAdd />}
              onClick={() => createTag()}>
              {t('tags.overview.createTag')}
            </RIconButton>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      {loading && (
        <FlexboxGrid justify="center">
          <Loader size="lg" />
        </FlexboxGrid>
      )}

      <TableWrapper>
        <Table
          fillHeight
          loading={loading}
          data={Object.entries(formValue).map(([id, value]) => ({id, ...value}))}>
          <Column width={400} align="left" resizable>
            <HeaderCell>{t('tags.overview.name')}</HeaderCell>
            <Cell>
              {(rowData: any) => (
                <Input
                  value={rowData.tag ?? ''}
                  placeholder={t('tags.overview.placeholder')}
                  onChange={(value: string) => {
                    dispatchFormValue({
                      type: TagListActionType.Update,
                      payload: {
                        id: rowData.id,
                        tag: value
                      }
                    })
                  }}
                />
              )}
            </Cell>
          </Column>

          <Column width={150} align="center" resizable>
            <HeaderCell>{t('tags.overview.mainTag')}</HeaderCell>
            <Cell>
              {(rowData: any) => (
                <Checkbox
                  checked={rowData.main}
                  onChange={(value, checked) => {
                    dispatchFormValue({
                      type: TagListActionType.Update,
                      payload: {
                        id: rowData.id,
                        main: checked
                      }
                    })
                  }}
                />
              )}
            </Cell>
          </Column>

          <Column width={150} align="center" fixed="right">
            <HeaderCell>{t('tags.overview.action')}</HeaderCell>
            <Cell>
              {(rowData: any) => (
                <>
                  <PermissionControl qualifyingPermissions={['CAN_UPDATE_TAG']}>
                    <IconButtonTooltip caption={t('save')}>
                      <IconButton
                        circle
                        size="sm"
                        icon={<MdSave />}
                        onClick={() => {
                          updateTag({
                            variables: {
                              id: rowData.id,
                              tag: rowData.tag,
                              main: rowData.main
                            }
                          })
                        }}
                        disabled={!shouldUpdateTag(rowData.id)}
                      />
                    </IconButtonTooltip>
                  </PermissionControl>

                  <PermissionControl qualifyingPermissions={['CAN_DELETE_TAG']}>
                    <IconButtonTooltip caption={t('delete')}>
                      <IconButton
                        color="red"
                        appearance="ghost"
                        circle
                        size="sm"
                        icon={<MdDelete />}
                        onClick={() => setTagToDelete(rowData.id)}
                      />
                    </IconButtonTooltip>
                  </PermissionControl>
                </>
              )}
            </Cell>
          </Column>
        </Table>

        <Pagination
          limit={limit}
          limitOptions={DEFAULT_TABLE_PAGE_SIZES}
          maxButtons={DEFAULT_MAX_TABLE_PAGES}
          first
          last
          prev
          next
          ellipsis
          boundaryLinks
          layout={['total', '-', 'limit', '|', 'pager', 'skip']}
          total={total}
          activePage={page}
          onChangePage={page => setPage(page)}
          onChangeLimit={limit => setLimit(limit)}
        />
      </TableWrapper>

      <Modal open={!!tagToDelete} backdrop="static" size="xs" onClose={() => setTagToDelete(null)}>
        <Modal.Title>{t('tags.overview.areYouSure')}</Modal.Title>
        <Modal.Body>
          {tagToDelete && t('tags.overview.areYouSureBody', {tag: formValue[tagToDelete].tag})}
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="red"
            appearance="primary"
            onClick={() => {
              deleteTag({
                variables: {
                  id: tagToDelete!
                }
              })
              setTagToDelete(null)
            }}>
            {t('tags.overview.areYouSureConfirmation')}
          </Button>

          <Button appearance="subtle" onClick={() => setTagToDelete(null)}>
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
})

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_TAGS',
  'CAN_CREATE_TAG',
  'CAN_UPDATE_TAG',
  'CAN_DELETE_TAG'
])(TagList)
export {CheckedPermissionComponent as TagList}
