import React, {useState, useEffect} from 'react'

import {FlexboxGrid, IconButton, Drawer, Table, Modal, Button, InputGroup, Input} from 'rsuite'
import {useTranslation} from 'react-i18next'

import {DescriptionList, DescriptionListItem} from '../atoms/descriptionList'

import {
  Link,
  RouteType,
  useRoute,
  useRouteDispatch,
  MemberPlanEditRoute,
  MemberPlanCreateRoute,
  MemberPlanListRoute,
  ButtonLink
} from '../route'

import {RouteActionType} from '@wepublish/karma.run-react'

import {
  FullMemberPlanFragment,
  MemberPlanListDocument,
  MemberPlanListQuery,
  useDeleteMemberPlanMutation,
  useMemberPlanListQuery
} from '../api'
import {IconButtonTooltip} from '../atoms/iconButtonTooltip'
import {MemberPlanEditPanel} from '../panel/memberPlanEditPanel'
import TrashIcon from '@rsuite/icons/legacy/Trash'
import SearchIcon from '@rsuite/icons/legacy/Search'
const {Column, HeaderCell, Cell /*, Pagination */} = Table

export function MemberPlanList() {
  const {current} = useRoute()
  const dispatch = useRouteDispatch()

  const {t} = useTranslation()

  const [isEditModalOpen, setEditModalOpen] = useState(
    current?.type === RouteType.MemberPlanEdit || current?.type === RouteType.MemberPlanCreate
  )

  const [editID, setEditID] = useState<string | undefined>(
    current?.type === RouteType.MemberPlanEdit ? current.params.id : undefined
  )

  const [filter, setFilter] = useState('')

  const [memberPlans, setMemberPlans] = useState<FullMemberPlanFragment[]>([])

  const [isConfirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [currentMemberPlan, setCurrentMemberPlan] = useState<FullMemberPlanFragment>()

  const {data, /* fetchMore, */ loading: isLoading} = useMemberPlanListQuery({
    variables: {
      filter: filter || undefined,
      first: 50
    },
    fetchPolicy: 'network-only'
  })

  const [deleteMemberPlan, {loading: isDeleting}] = useDeleteMemberPlanMutation()

  useEffect(() => {
    switch (current?.type) {
      case RouteType.MemberPlanCreate:
        setEditID(undefined)
        setEditModalOpen(true)
        break

      case RouteType.MemberPlanEdit:
        setEditID(current.params.id)
        setEditModalOpen(true)
        break
    }
  }, [current])

  useEffect(() => {
    if (data?.memberPlans?.nodes) {
      setMemberPlans(data.memberPlans.nodes)
    }
  }, [data?.memberPlans])

  /* function loadMore() {
    fetchMore({
      variables: {first: 50, after: data?.memberPlans.pageInfo.endCursor},
      updateQuery: (prev, {fetchMoreResult}) => {
        if (!fetchMoreResult) return prev

        return {
          memberPlans: {
            ...fetchMoreResult.memberPlans,
            nodes: [...prev.memberPlans.nodes, ...fetchMoreResult?.memberPlans.nodes]
          }
        }
      }
    })
  } */

  return (
    <>
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={16}>
          <h2>{t('memberPlanList.title')}</h2>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={8} style={{textAlign: 'right'}}>
          <ButtonLink
            appearance="primary"
            disabled={isLoading}
            route={MemberPlanCreateRoute.create({})}>
            {t('memberPlanList.createNew')}
          </ButtonLink>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={24} style={{marginTop: '20px'}}>
          <InputGroup>
            <Input value={filter} onChange={value => setFilter(value)} />
            <InputGroup.Addon>
              <SearchIcon />
            </InputGroup.Addon>
          </InputGroup>
        </FlexboxGrid.Item>
      </FlexboxGrid>

      <Table autoHeight style={{marginTop: '20px'}} loading={isLoading} data={memberPlans}>
        <Column width={200} align="left" resizable>
          <HeaderCell>{t('memberPlanList.name')}</HeaderCell>
          <Cell>
            {(rowData: FullMemberPlanFragment) => (
              <Link route={MemberPlanEditRoute.create({id: rowData.id})}>
                {rowData.name || t('untitled')}
              </Link>
            )}
          </Cell>
        </Column>
        <Column width={100} align="center" fixed="right">
          <HeaderCell>{t('memberPlanList.action')}</HeaderCell>
          <Cell style={{padding: '6px 0'}}>
            {(rowData: FullMemberPlanFragment) => (
              <>
                <IconButtonTooltip caption={t('memberPlanList.delete')}>
                  <IconButton
                    icon={<TrashIcon />}
                    circle
                    size="sm"
                    style={{marginLeft: '5px'}}
                    onClick={() => {
                      setConfirmationDialogOpen(true)
                      setCurrentMemberPlan(rowData)
                    }}
                  />
                </IconButtonTooltip>
              </>
            )}
          </Cell>
        </Column>
      </Table>

      <Drawer
        open={isEditModalOpen}
        size={'sm'}
        onClose={() => {
          setEditModalOpen(false)
          dispatch({
            type: RouteActionType.PushRoute,
            route: MemberPlanListRoute.create({}, current ?? undefined)
          })
        }}>
        <MemberPlanEditPanel
          id={editID}
          onClose={() => {
            setEditModalOpen(false)
            dispatch({
              type: RouteActionType.PushRoute,
              route: MemberPlanListRoute.create({}, current ?? undefined)
            })
          }}
          onSave={() => {
            setEditModalOpen(false)
            dispatch({
              type: RouteActionType.PushRoute,
              route: MemberPlanListRoute.create({}, current ?? undefined)
            })
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
                      first: 50
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
