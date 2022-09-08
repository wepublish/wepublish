import {ApolloError} from '@apollo/client'
import SaveIcon from '@rsuite/icons/legacy/Save'
import TrashIcon from '@rsuite/icons/legacy/Trash'
import React, {memo, useCallback, useEffect, useReducer, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {
  Button,
  FlexboxGrid,
  Form,
  IconButton,
  Loader,
  Message,
  Modal,
  Pagination,
  toaster
} from 'rsuite'

import {
  Tag,
  TagType,
  useCreateTagMutation,
  useDeleteTagMutation,
  useTagListLazyQuery,
  useUpdateTagMutation
} from '../api'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'
import {DEFAULT_MAX_TABLE_PAGES, DEFAULT_TABLE_PAGE_SIZES} from '../utility'

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
  | {type: TagListActionType.Set; payload: Record<string, string>}
  | {type: TagListActionType.Create; payload: {id: string}}
  | {type: TagListActionType.Update; payload: {id: string; value: string}}
  | {type: TagListActionType.Delete; payload: {id: string}}

const mapTagsToFormValue = (tags: Tag[] | null | undefined) =>
  tags?.reduce((obj, node) => {
    obj[node.id] = node.tag ?? ''

    return obj
  }, {} as Record<string, string>) ?? {}

const tagFormValueReducer = (
  state: Record<string, string>,
  action: TagListActions
): Record<string, string> => {
  switch (action.type) {
    case TagListActionType.Set:
      return action.payload

    case TagListActionType.Create:
      return {
        [action.payload.id]: '',
        ...state
      }

    case TagListActionType.Update: {
      const newState = {...state}
      newState[action.payload.id] = action.payload.value

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

export const TagList = memo<TagListProps>(({type}) => {
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
        payload: {
          id: updatedTag.updateTag.id,
          value: updatedTag.updateTag.tag ?? ''
        }
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

      return apiTag !== formTag
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
        skip: (page - 1) * limit
      }
    })
  }, [limit, page])

  return (
    <>
      <FlexboxGrid style={{marginBottom: '40px'}}>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('tags.overview.title')}</h2>
        </FlexboxGrid.Item>

        <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
          <Button
            type="button"
            appearance="primary"
            data-testid="create"
            onClick={() => createTag()}>
            {t('tags.overview.createTag')}
          </Button>
        </FlexboxGrid.Item>
      </FlexboxGrid>

      {loading && (
        <FlexboxGrid justify="center">
          <Loader size="lg" style={{margin: '30px'}} />
        </FlexboxGrid>
      )}

      {Object.entries(formValue).map(([tagId, inputValue]) => (
        <Form key={tagId}>
          <FlexboxGrid style={{marginBottom: '12px'}}>
            <div style={{maxWidth: '300px', flex: '1 1'}}>
              <Form.Control
                name={tagId}
                value={inputValue}
                placeholder={t('tags.overview.placeholder')}
                onChange={(value: string) => {
                  dispatchFormValue({
                    type: TagListActionType.Update,
                    payload: {
                      id: tagId,
                      value
                    }
                  })
                }}
              />
            </div>

            <div style={{flex: '0 0 auto'}}>
              <IconButtonTooltip caption={t('save')}>
                <IconButton
                  type="submit"
                  icon={<SaveIcon />}
                  circle
                  size="sm"
                  style={{marginLeft: '12px'}}
                  onClick={() => {
                    updateTag({
                      variables: {
                        id: tagId,
                        tag: formValue[tagId] ? formValue[tagId] : null
                      }
                    })
                  }}
                  disabled={!shouldUpdateTag(tagId)}
                />
              </IconButtonTooltip>

              <IconButtonTooltip caption={t('delete')}>
                <IconButton
                  icon={<TrashIcon />}
                  color="red"
                  appearance="primary"
                  circle
                  size="sm"
                  style={{marginLeft: '12px'}}
                  onClick={() => setTagToDelete(tagId)}
                />
              </IconButtonTooltip>
            </div>
          </FlexboxGrid>
        </Form>
      ))}

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
