import React, {useMemo} from 'react'
import {
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  createCheckedPermissionComponent,
  IconButton,
  TableWrapper
} from '@wepublish/ui/editor'
import {MdAdd} from 'react-icons/md'
import {useTranslation} from 'react-i18next'
import {Link} from 'react-router-dom'
import {Table as RTable, Table} from 'rsuite'
import {getApiClientV2} from '@wepublish/editor/api-v2'

const {Column, HeaderCell, Cell: RCell} = RTable

function CrowdfundingList() {
  const {t} = useTranslation()

  const client = useMemo(() => getApiClientV2(), [])

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <h2>{t('crowdfunding.list.title')}</h2>
        </ListViewHeader>

        <ListViewActions>
          <Link to="create">
            <IconButton appearance="primary" loading={false}>
              <MdAdd />
              {t('banner.list.createNew')}
            </IconButton>
          </Link>
        </ListViewActions>
      </ListViewContainer>

      <TableWrapper>
        <Table fillHeight></Table>
      </TableWrapper>
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_CROWDFUNDINGS',
  'CAN_GET_CROWDFUNDING',
  'CAN_CREATE_CROWDFUNDING',
  'CAN_DELETE_CROWDFUNDING'
])(CrowdfundingList)

export {CheckedPermissionComponent as CrowdfundingList}
