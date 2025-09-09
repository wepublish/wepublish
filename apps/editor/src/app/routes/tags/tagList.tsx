import {ApolloError} from '@apollo/client'
import {TagCreateForm} from './tagCreateForm'
import {Tag, TagType, useDeleteTagMutation, useTagListQuery} from '@wepublish/editor/api'
import {
  createCheckedPermissionComponent,
  DEFAULT_MAX_TABLE_PAGES,
  DEFAULT_TABLE_PAGE_SIZES,
  IconButton,
  IconButtonTooltip,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PaddedCell,
  PermissionControl,
  Table,
  TableWrapper
} from '@wepublish/ui/editor'
import {memo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdAdd, MdDelete} from 'react-icons/md'
import {
  Button,
  Drawer,
  IconButton as RIconButton,
  Message,
  Modal,
  Pagination,
  Table as RTable,
  Tag as RTag,
  toaster
} from 'rsuite'

const {Column, HeaderCell, Cell} = RTable

export type TagListProps = {
  type: TagType
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
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null)
  const [isCreateDrawerOpen, setCreateDrawerOpen] = useState(false)

  const {data, loading, refetch} = useTagListQuery({
    variables: {
      take: limit,
      skip: (page - 1) * limit,
      filter: {
        type
      }
    },
    fetchPolicy: 'cache-and-network',
    onError: showErrors
  })

  const [deleteTag, {loading: isDeleting}] = useDeleteTagMutation({
    onError: showErrors,
    onCompleted() {
      refetch()
      setTagToDelete(null)
      toaster.push(
        <Message type="success" showIcon closable duration={3000}>
          {t('tags.overview.deleteSuccess')}
        </Message>
      )
    }
  })

  const tags = data?.tags?.nodes ?? []
  const total = data?.tags?.totalCount ?? 0

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
              onClick={() => setCreateDrawerOpen(true)}>
              {t('tags.overview.createTag')}
            </RIconButton>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      <TableWrapper>
        <Table fillHeight loading={loading} data={tags}>
          <Column width={400} align="left" resizable>
            <HeaderCell>{t('tags.overview.name')}</HeaderCell>
            <Cell dataKey="tag">
              {(rowData: Tag) => <span>{rowData.tag || t('tags.overview.untitled')}</span>}
            </Cell>
          </Column>

          <Column width={150} align="center" resizable>
            <HeaderCell>{t('tags.overview.specialTags')}</HeaderCell>
            <Cell>
              {(rowData: Tag) =>
                rowData.main && <RTag color="blue">{t('tags.overview.main')}</RTag>
              }
            </Cell>
          </Column>

          <Column width={100} align="center" fixed="right">
            <HeaderCell>{t('tags.overview.action')}</HeaderCell>
            <PaddedCell>
              {(rowData: Tag) => (
                <PermissionControl qualifyingPermissions={['CAN_DELETE_TAG']}>
                  <IconButtonTooltip caption={t('delete')}>
                    <IconButton
                      icon={<MdDelete />}
                      circle
                      size="sm"
                      appearance="ghost"
                      color="red"
                      onClick={() => setTagToDelete(rowData)}
                    />
                  </IconButtonTooltip>
                </PermissionControl>
              )}
            </PaddedCell>
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
        <Modal.Title>{t('tags.overview.deleteTag')}</Modal.Title>
        <Modal.Body>
          {tagToDelete && t('tags.overview.deleteTagBody', {tag: tagToDelete.tag})}
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="red"
            appearance="primary"
            disabled={isDeleting}
            loading={isDeleting}
            onClick={() => {
              if (tagToDelete) {
                deleteTag({
                  variables: {
                    id: tagToDelete.id
                  }
                })
              }
            }}>
            {t('tags.overview.confirm')}
          </Button>

          <Button appearance="subtle" onClick={() => setTagToDelete(null)}>
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>

      <Drawer open={isCreateDrawerOpen} onClose={() => setCreateDrawerOpen(false)} size="sm">
        <Drawer.Header>
          <Drawer.Title>{t('tags.overview.createTag')}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <TagCreateForm
            type={type}
            onSuccess={() => {
              setCreateDrawerOpen(false)
              refetch()
            }}
            onCancel={() => setCreateDrawerOpen(false)}
          />
        </Drawer.Body>
      </Drawer>
    </>
  )
})

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_TAGS',
  'CAN_CREATE_TAG',
  'CAN_DELETE_TAG'
])(TagList)
export {CheckedPermissionComponent as TagList}
