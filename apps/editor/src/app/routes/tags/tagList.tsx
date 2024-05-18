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
  IconButtonTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PermissionControl,
  TableWrapper
} from '@wepublish/ui/editor'
import {equals} from 'ramda'
import {memo, useCallback, useEffect, useReducer, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdAdd, MdDelete, MdSave} from 'react-icons/md'
import {
  Button,
  Checkbox,
  FlexboxGrid,
  Form,
  IconButton as RIconButton,
  Loader as RLoader,
  Message,
  Modal,
  Pagination,
  toaster
} from 'rsuite'

const FlexGridSmallerMargin = styled(FlexboxGrid)`
  margin-bottom: 12px;
`

const Content = styled.div`
  margin-top: 2rem;
  height: 100%;
`

const IconButton = styled(RIconButton)`
  margin-left: 12px;
`

const Flex = styled.div`
  flex: 0 0 auto;
`

const FlexWrapper = styled.div`
  max-width: 300px;
  flex: 1 1;
`

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

const mapTagsToFormValue = (tags: Tag[] | null | undefined) =>
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
    fetchPolicy: 'no-cache',
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
        <Content>
          {Object.entries(formValue).map(([tagId, inputValue]) => (
            <Form key={tagId}>
              <FlexGridSmallerMargin>
                <FlexWrapper>
                  <Form.Control
                    name={tagId}
                    value={inputValue.tag}
                    placeholder={t('tags.overview.placeholder')}
                    onChange={(tag: string) => {
                      dispatchFormValue({
                        type: TagListActionType.Update,
                        payload: {
                          id: tagId,
                          tag
                        }
                      })
                    }}
                  />
                </FlexWrapper>

                <Flex>
                  <Checkbox
                    name={tagId}
                    checked={inputValue.main}
                    value={inputValue.main ? 0 : 1}
                    onChange={main => {
                      dispatchFormValue({
                        type: TagListActionType.Update,
                        payload: {
                          id: tagId,
                          main: !!main
                        }
                      })
                    }}>
                    Mark as main
                  </Checkbox>
                </Flex>

                <Flex>
                  <PermissionControl qualifyingPermissions={['CAN_UPDATE_TAG']}>
                    <IconButtonTooltip caption={t('save')}>
                      <IconButton
                        type="submit"
                        circle
                        size="sm"
                        icon={<MdSave />}
                        onClick={() => {
                          formValue[tagId] &&
                            updateTag({
                              variables: {
                                id: tagId,
                                ...formValue[tagId]
                              }
                            })
                        }}
                        disabled={!shouldUpdateTag(tagId)}
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
                        onClick={() => setTagToDelete(tagId)}
                      />
                    </IconButtonTooltip>
                  </PermissionControl>
                </Flex>
              </FlexGridSmallerMargin>
            </Form>
          ))}
        </Content>

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
        <Modal.Body>{t('tags.overview.areYouSureBody', {tag: formValue[tagToDelete!]})}</Modal.Body>
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
