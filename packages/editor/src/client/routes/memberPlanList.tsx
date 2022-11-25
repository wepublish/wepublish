import React, {useEffect, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {MdDelete, MdSearch} from 'react-icons/md'
import {Link, useLocation, useNavigate, useParams} from 'react-router-dom'
import {Button, Drawer, FlexboxGrid, IconButton, Input, InputGroup, Modal, Table} from 'rsuite'

import {
  FullMemberPlanFragment,
  MemberPlanListDocument,
  MemberPlanListQuery,
  useDeleteMemberPlanMutation,
  useMemberPlanListQuery
} from '../api'
import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'
import {createCheckedPermissionComponent, PermissionControl} from '../atoms/permissionControl'
import {MemberPlanEditPanel} from '../panel/memberPlanEditPanel'

const {Column, HeaderCell, Cell} = Table

function MemberPlanList() {
  const {t} = useTranslation()
  const location = useLocation()
  const params = useParams()
  const navigate = useNavigate()
  const {id} = params

  const isCreateRoute = location.pathname.includes('create')
  const isEditRoute = location.pathname.includes('edit')

  const [isEditModalOpen, setEditModalOpen] = useState(isEditRoute || isCreateRoute)

  const [editID, setEditID] = useState<string | undefined>(isEditRoute ? id : undefined)

  const [filter, setFilter] = useState('')

  const [memberPlans, setMemberPlans] = useState<FullMemberPlanFragment[]>([])

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentMemberPlan, setCurrentMemberPlan] = useState<FullMemberPlanFragment>()

  const {data, loading: isLoading} = useMemberPlanListQuery({
    variables: {
      filter: filter || undefined,
      take: 50
    },
    fetchPolicy: 'network-only'
  })

  const [deleteMemberPlan, {loading: isDeleting}] = useDeleteMemberPlanMutation()

  useEffect(() => {
    if (isCreateRoute) {
      setEditID(undefined)
      setEditModalOpen(true)
    }

    if (isEditRoute) {
      setEditID(id)
      setEditModalOpen(true)
    }
  }, [location])

  useEffect(() => {
    if (data?.memberPlans?.nodes) {
      setMemberPlans(data.memberPlans.nodes)
    }
  }, [data?.memberPlans])

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('memberPlanList.title')}</h2>
        </FlexboxGrid.Item>
        <PermissionControl qualifyingPermissions={['CAN_CREATE_MEMBER_PLAN']}>
          <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
            <Link to="/memberplans/create">
              <Button appearance="primary" disabled={isLoading}>
                {t('memberPlanList.createNew')}
              </Button>
            </Link>
          </FlexboxGrid.Item>
        </PermissionControl>
        <FlexboxGrid.Item colspan={24} style={{marginTop: '20px'}}>
          <InputGroup>
            <Input value={filter} onChange={value => setFilter(value)} />
            <InputGroup.Addon>
              <MdSearch />
            </InputGroup.Addon>
          </InputGroup>
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <Table autoHeight style={{marginTop: '20px'}} loading={isLoading} data={memberPlans}>
        <Column width={200} align="left" resizable>
          <HeaderCell>{t('memberPlanList.name')}</HeaderCell>
          <Cell>
            {(rowData: FullMemberPlanFragment) => (
              <Link to={`/memberplans/edit/${rowData.id}`}>{rowData.name || t('untitled')}</Link>
            )}
          </Cell>
        </Column>
        <Column width={100} align="center" fixed="right">
          <HeaderCell>{t('memberPlanList.action')}</HeaderCell>
          <Cell style={{padding: '6px 0'}}>
            {(rowData: FullMemberPlanFragment) => (
              <PermissionControl qualifyingPermissions={['CAN_DELETE_MEMBER_PLAN']}>
                <IconButtonTooltip caption={t('delete')}>
                  <IconButton
                    icon={<MdDelete />}
                    circle
                    size="sm"
                    style={{marginLeft: '5px'}}
                    onClick={() => {
                      setConfirmationDialogOpen(true)
                      setCurrentMemberPlan(rowData)
                    }}
                  />
                </IconButtonTooltip>
              </PermissionControl>
            )}
          </Cell>
        </Column>
      </Table>

      <Drawer
        open={isEditModalOpen}
        size={'sm'}
        onClose={() => {
          setEditModalOpen(false)
          navigate('/memberplans')
        }}>
        <MemberPlanEditPanel
          id={editID}
          onClose={() => {
            setEditModalOpen(false)
            navigate('/memberplans')
          }}
          onSave={() => {
            setEditModalOpen(false)
            navigate('/memberplans')
          }}
        />
      </Drawer>

      <Modal open={isConfirmationDialogOpen} size={'sm'}>
        <Modal.Header>
          <Modal.Title>{t('memberPlanList.deleteModalTitle')}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <DescriptionList>
            <DescriptionListItem label={t('memberPlanList.name')}>
              {currentMemberPlan?.name || t('untitled')}
            </DescriptionListItem>
          </DescriptionList>
        </Modal.Body>

        <Modal.Footer>
          <Button
            disabled={isDeleting}
            onClick={async () => {
              if (!currentMemberPlan) return

              await deleteMemberPlan({
                variables: {id: currentMemberPlan.id},
                update: cache => {
                  const query = cache.readQuery<MemberPlanListQuery>({
                    query: MemberPlanListDocument,
                    variables: {
                      filter: filter || undefined,
                      take: 50
                    }
                  })

                  if (!query) return

                  cache.writeQuery<MemberPlanListQuery>({
                    query: MemberPlanListDocument,
                    data: {
                      memberPlans: {
                        ...query.memberPlans,
                        nodes: query.memberPlans.nodes.filter(
                          memberPlan => memberPlan.id !== currentMemberPlan.id
                        )
                      }
                    }
                  })
                }
              })

              setConfirmationDialogOpen(false)
            }}
            color="red">
            {t('confirm')}
          </Button>
          <Button onClick={() => setConfirmationDialogOpen(false)} appearance="subtle">
            {t('cancel')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

const CheckedPermissionComponent = createCheckedPermissionComponent([
  'CAN_GET_MEMBER_PLANS',
  'CAN_GET_MEMBER_PLAN',
  'CAN_CREATE_MEMBER_PLAN',
  'CAN_DELETE_MEMBER_PLAN'
])(MemberPlanList)
export {CheckedPermissionComponent as MemberPlanList}
